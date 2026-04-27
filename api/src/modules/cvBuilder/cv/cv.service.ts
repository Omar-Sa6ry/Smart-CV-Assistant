import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateCvInput } from './inputs/createCv.Input';
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
      .setHeadline(data?.headline)
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

    if (!cv || (userId && cv.userId !== userId))
      throw new NotFoundException(await this.i18n.t('cv.NOT_FOUND'));

    await this.redisService.set(`cv:${cvId}`, cv);
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
          ...(data.headline && { headline: data.headline }),
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
}
