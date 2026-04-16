import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateCvInput } from './inputs/createCv.Input';
import { CreateFullCvInput } from './inputs/createFullCv.input';
import { UpdateCvInput } from './inputs/updateCv.Input';
import { CvResponse, CvsResponse } from './dtos/cvResponse.dto';
import { UserService } from 'src/modules/users/users.service';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { CvBuilderFactory } from './builder/cv-builder.factory';
import { CvFactory } from './factory/cv.factory';
import { RedisService } from '@bts-soft/core';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly builderFactory: CvBuilderFactory,
  ) {}

  async createCv(userId: string, data: CreateCvInput): Promise<CvResponse> {
    const user = await this.userService.findById(userId);
    if (!user || !user.data)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'));

    const builder = this.builderFactory.create();
    const cvFields = builder
      .setTitle(data.title)
      .setSummary(data.summary)
      .setPhone(data.phone)
      .setUser(userId)
      .setIsDefault(data.isDefault || false)
      .setLinkedin(data?.linkedin)
      .setPortfolio(data?.portfolio)
      .setGithub(data?.github)
      .setLocation(data?.location)
      .build();

    const cv = await this.prisma.$transaction(async (tx) => {
      if (cvFields.isDefault) {
        await tx.cv.updateMany({
          where: { userId: userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.cv.create({
        data: cvFields as any,
      });
    });

    const cvFac = CvFactory.fromPrisma({ ...cv, user: user.data } as any);
    await this.redisService.set(`cv:${cv.id}`, cvFac);

    return {
      data: cvFac,
      statusCode: 201,
      message: await this.i18n.t('cv.CREATED'),
    };
  }

  async createFullCv(
    userId: string,
    data: CreateFullCvInput,
  ): Promise<CvResponse> {
    const user = await this.validateUser(userId);
    const cvFields = this.buildCvFields(userId, data);

    const cvWithRelations = await this.prisma.$transaction(async (tx) => {
      await this.handleDefaultCvStatus(tx, userId, cvFields.isDefault || false);

      const createdCv = await tx.cv.create({
        data: cvFields as any,
      });

      const cvId = createdCv.id;

      await this.processExperiences(tx, userId, cvId, data.experiences);
      await this.processEducations(tx, userId, cvId, data.educations);
      await this.processProjects(tx, userId, cvId, data.projects);
      await this.processCertifications(tx, userId, cvId, data.certifications);
      await this.processLanguages(tx, userId, cvId, data.languages);
      await this.processSkills(tx, userId, cvId, data.skills);

      return this.fetchFullCv(tx, cvId);
    });

    return this.finalizeCvResponse(cvWithRelations);
  }

  async getUserCvs(
    userId: string,
    paginationInput?: PaginationInput,
  ): Promise<CvsResponse> {
    const page = paginationInput?.page || 1;
    const limit = paginationInput?.limit || 10;

    const [cvs, total] = await this.prisma.$transaction([
      this.prisma.cv.findMany({
        where: { userId },
        include: { user: true },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cv.count({ where: { userId } }),
    ]);

    return {
      items: CvFactory.fromPrismaArray(cvs),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getById(
    cvId: string,
    userId?: string,
    skipCache = false,
  ): Promise<CvResponse> {
    if (!skipCache) {
      const cachedCv = await this.redisService.get(`cv:${cvId}`);
      if (cachedCv) return { data: cachedCv };
    }

    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: {
        user: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        languages: true,
        skills: {
          include: {
            keyword: true,
          },
        },
      },
    });

    if (!cv || (userId && cv.userId !== userId))
      throw new NotFoundException(await this.i18n.t('cv.NOT_FOUND'));

    return { data: CvFactory.fromPrisma(cv) };
  }

  async updateCv(
    cvId: string,
    userId: string,
    data: UpdateCvInput,
  ): Promise<CvResponse> {
    await this.userService.findById(userId);

    const cv = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault)
        await tx.cv.updateMany({
          where: { userId: userId, isDefault: true },
          data: { isDefault: false },
        });

      return tx.cv.update({
        where: { id: cvId, userId: userId },
        data: {
          ...(data.linkedin && { linkedin: data.linkedin }),
          ...(data.portfolio && { portfolio: data.portfolio }),
          ...(data.github && { github: data.github }),
          ...(data.title && { title: data.title }),
          ...(data.phone && { phone: data.phone }),
          ...(data.summary && { summary: data.summary }),
          ...(data.location && { location: data.location }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });
    });

    const cvFac = CvFactory.fromPrisma(cv);
    await this.redisService.update(`cv:${cv.id}`, cvFac);

    return {
      data: cvFac,
      message: await this.i18n.t('cv.UPDATED'),
    };
  }

  async deleteCv(cvId: string, userId: string): Promise<CvResponse> {
    await this.userService.findById(userId);

    await this.prisma.cv.delete({
      where: {
        id: cvId,
        userId,
      },
    });

    await this.redisService.del(`cv:${cvId}`);
    return {
      data: null,
      message: await this.i18n.t('cv.DELETED'),
    };
  }

  async invalidateCache(cvId: string, data: any) {
    await this.redisService.update(`cv:${cvId}`, data);
  }

  private async validateUser(userId: string) {
    const user = await this.userService.findById(userId);
    if (!user || !user.data) {
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'));
    }
    return user.data;
  }

  private buildCvFields(userId: string, data: CreateCvInput) {
    return this.builderFactory
      .create()
      .setTitle(data.title)
      .setSummary(data.summary)
      .setPhone(data.phone)
      .setUser(userId)
      .setIsDefault(data.isDefault || false)
      .setLinkedin(data?.linkedin)
      .setPortfolio(data?.portfolio)
      .setGithub(data?.github)
      .setLocation(data?.location)
      .build();
  }

  private async handleDefaultCvStatus(
    tx: Prisma.TransactionClient,
    userId: string,
    isDefault: boolean,
  ) {
    if (isDefault) {
      await tx.cv.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
  }

  private async processExperiences(
    tx: Prisma.TransactionClient,
    userId: string,
    cvId: string,
    experiences?: any[],
  ) {
    if (!experiences?.length) return;
    await tx.experience.createMany({
      data: experiences.map((exp) => ({
        ...exp,
        userId,
        cvId,
        description: exp.description || '',
      })),
    });
  }

  private async processEducations(
    tx: Prisma.TransactionClient,
    userId: string,
    cvId: string,
    educations?: any[],
  ) {
    if (!educations?.length) return;
    await tx.education.createMany({
      data: educations.map((edu) => ({
        ...edu,
        userId,
        cvId,
        description: edu.description || '',
      })),
    });
  }

  private async processProjects(
    tx: Prisma.TransactionClient,
    userId: string,
    cvId: string,
    projects?: any[],
  ) {
    if (!projects?.length) return;
    await tx.project.createMany({
      data: projects.map((proj) => ({
        ...proj,
        userId,
        cvId,
      })),
    });
  }

  private async processCertifications(
    tx: Prisma.TransactionClient,
    userId: string,
    cvId: string,
    certifications?: any[],
  ) {
    if (!certifications?.length) return;
    await tx.certification.createMany({
      data: certifications.map((cert) => ({
        ...cert,
        userId,
        cvId,
      })),
    });
  }

  private async processLanguages(
    tx: Prisma.TransactionClient,
    userId: string,
    cvId: string,
    languages?: any[],
  ) {
    if (!languages?.length) return;
    await tx.language.createMany({
      data: languages.map((lang) => ({
        ...lang,
        userId,
        cvId,
      })),
    });
  }

  private async processSkills(
    tx: Prisma.TransactionClient,
    userId: string,
    cvId: string,
    skills?: any[],
  ) {
    if (!skills?.length) return;

    const skillNames = skills.map((s) => s.name);
    const existingKeywords = await tx.skillKeyword.findMany({
      where: { name: { in: skillNames, mode: 'insensitive' } },
    });

    for (const skillData of skills) {
      let keyword = existingKeywords.find(
        (k) => k.name.toLowerCase() === skillData.name.toLowerCase(),
      );

      if (keyword) {
        keyword = await tx.skillKeyword.update({
          where: { id: keyword.id },
          data: { popularityScore: { increment: 1 } },
        });
      } else {
        keyword = await tx.skillKeyword.create({
          data: {
            name: skillData.name,
            isVerified: false,
            popularityScore: 1,
          },
        });
      }

      await tx.skill.create({
        data: {
          name: skillData.name,
          category: skillData.category,
          proficiency: skillData.proficiency,
          yearsOfExperience: skillData.yearsOfExperience,
          userId,
          cvId,
          keywordId: keyword.id,
        },
      });
    }
  }

  private async fetchFullCv(tx: Prisma.TransactionClient, cvId: string) {
    const cv = await tx.cv.findUnique({
      where: { id: cvId },
      include: {
        user: true,
        experiences: true,
        educations: true,
        certifications: true,
        projects: true,
        languages: true,
        skills: {
          include: {
            keyword: true,
          },
        },
      },
    });

    if (!cv) {
      throw new NotFoundException(await this.i18n.t('cv.NOT_FOUND'));
    }
    return cv;
  }

  private async finalizeCvResponse(cvWithRelations: any): Promise<CvResponse> {
    const cvFac = CvFactory.fromPrisma(cvWithRelations);
    await this.redisService.set(`cv:${cvWithRelations.id}`, cvFac);

    return {
      data: cvFac,
      statusCode: 201,
      message: await this.i18n.t('cv.CREATED'),
    };
  }
}
