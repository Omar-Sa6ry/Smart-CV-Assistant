import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateCvInput } from './inputs/createCv.Input';
import { UpdateCvInput } from './inputs/updateCv.Input';
import { CvResponse, CvsResponse } from './dtos/cvResponse.dto';
import { UserService } from 'src/modules/users/users.service';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { CvBuilderFactory } from './builder/cv-builder.factory';
import { ModernPdfStrategy } from './strategies/modern-pdf.strategy';
import { ClassicPdfStrategy } from './strategies/classic-pdf.strategy';
import { ICvExportStrategy } from './strategies/export-strategy.interface';
import { CvFactory } from './factory/cv.factory';

@Injectable()
export class CvService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly userService: UserService,
    private readonly builderFactory: CvBuilderFactory,
    private readonly classicStrategy: ClassicPdfStrategy,
    private readonly modernStrategy: ModernPdfStrategy,
  ) {}

  async createCv(userId: string, data: CreateCvInput): Promise<CvResponse> {
    const user = await this.userService.findById(userId);
    if (!user || !user.data)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'));

    const builder = this.builderFactory.create();
    const cvFields = builder
      .setTitle(data.title)
      .setSummary(data.summary)
      .setUser(userId)
      .setIsDefault(data.isDefault || false)
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

    return {
      data: CvFactory.fromPrisma({ ...cv, user: user.data } as any),
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

  async getById(cvId: string, userId?: string): Promise<CvResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: cvId },
      include: { user: true, experiences: true },
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
          ...(data.title && { title: data.title }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });
    });

    return {
      data: CvFactory.fromPrisma(cv),
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

    return {
      data: null,
      message: await this.i18n.t('cv.DELETED'),
    };
  }

  async exportCv(
    cvId: string,
    format: 'classic' | 'modern' = 'classic',
  ): Promise<any> {
    const cvResponse = await this.getById(cvId);
    if (!cvResponse.data) throw new NotFoundException('CV not found');

    const strategy: ICvExportStrategy =
      format === 'modern' ? this.modernStrategy : this.classicStrategy;

    return strategy.export(cvResponse.data);
  }
}
