import { Injectable, NotFoundException } from '@nestjs/common';
import { CvBuilderFactory } from '../builder/cv-builder.factory';
import { CreateFullCvInput } from '../inputs/createFullCv.input';
import { CvResponse } from '../dtos/cvResponse.dto';
import { CvFactory } from '../factory/cv.factory';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { UserService } from 'src/modules/users/users.service';
import { RedisService } from '@bts-soft/core';
import { CreateCvInput } from '../inputs/createCv.Input';
import { Prisma } from '@prisma/client';

@Injectable()
export class CreateCvFascade {
  constructor(
    private readonly builderFactory: CvBuilderFactory,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
  ) {}

  async createFullCv(
    userId: string,
    data: CreateFullCvInput,
  ): Promise<CvResponse> {
    await this.validateUser(userId);
    const cvFields = this.buildCvFields(userId, data);

    const cvWithRelations = await this.prisma.$transaction(
      async (tx) => {
        await this.handleDefaultCvStatus(
          tx,
          userId,
          cvFields.isDefault || false,
        );

        const createdCv = await tx.cv.create({
          data: cvFields as any,
        });

        const cvId = createdCv.id;

        await Promise.all([
          this.processExperiences(tx, userId, cvId, data.experiences),
          this.processEducations(tx, userId, cvId, data.educations),
          this.processSkills(tx, userId, cvId, data.skills),
          this.processProjects(tx, userId, cvId, data.projects),
          this.processCertifications(tx, userId, cvId, data.certifications),
          this.processLanguages(tx, userId, cvId, data.languages),
        ]);

        return this.fetchFullCv(tx, cvId);
      },
      {
        timeout: 20000,
      },
    );

    return this.finalizeCvResponse(cvWithRelations);
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
      .setHeadline(data.headline)
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

    const skillDataWithKeywords = await Promise.all(
      skills.map(async (skillData) => {
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

        return {
          name: skillData.name,
          category: skillData.category,
          proficiency: skillData.proficiency,
          userId,
          cvId,
          keywordId: keyword.id,
        };
      }),
    );

    await tx.skill.createMany({
      data: skillDataWithKeywords,
    });
  }

  async fetchFullCv(tx: Prisma.TransactionClient, cvId: string) {
    const cachedCv = await this.redisService.get(`cv:${cvId}`);
    if (cachedCv) return { data: cachedCv };

    const cv = await tx.cv.findUnique({
      where: { id: cvId },
      include: {
        user: true,
        experiences: true,
        educations: true,
        projects: true,
        languages: true,
        certifications: true,
        skills: {
          include: {
            keyword: true,
          },
        },
      },
    });

    if (!cv) throw new NotFoundException(await this.i18n.t('cv.NOT_FOUND'));

    await this.redisService.set(`cv:${cvId}`, cv);
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
