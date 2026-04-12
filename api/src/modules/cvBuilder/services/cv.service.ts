import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateCvInput } from '../inputs/createCv.Input';
import { UpdateCvInput } from '../inputs/updateCv.Input';
import { CvResponse, CvsResponse } from '../dtos/cvResponse.dto';
import { UserService } from 'src/modules/users/users.service';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';

@Injectable()
export class CvService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
    private userService: UserService,
  ) {}

  async createCv(userId: string, data: CreateCvInput): Promise<CvResponse> {
    const user = await this.userService.findById(userId);
    if (!user || !user.data)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'));

    const cv = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault) {
        await tx.cV.updateMany({
          where: { userId: userId, isDefault: true },
          data: { isDefault: false },
        });
      }

      return tx.cV.create({
        data: {
          userId: userId,
          title: data.title,
          isDefault: data.isDefault || false,
        },
      });
    });

    return {
      data: { ...cv, user: user.data },
      statusCode: 201,
      message: await this.i18n.t('cv.CREATED'),
    };
  }

  async getUserCvs(
    userId: string,
    paginationInput: PaginationInput,
  ): Promise<CvsResponse> {
    const { page, limit } = paginationInput;

    const [cvs, total] = await this.prisma.$transaction([
      this.prisma.cV.findMany({
        where: { userId },
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.cV.count({ where: { userId } }),
    ]);

    if (cvs.length === 0)
      throw new NotFoundException(await this.i18n.t('cv.NOT_FOUNDS'));

    return {
      items: cvs,
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getById(cvId: string, userId?: string): Promise<CvResponse> {
    const cv = await this.prisma.cV.findUnique({
      where: { id: cvId },
      include: { user: true },
    });

    if (!cv || (userId && cv.userId !== userId)) {
      throw new NotFoundException(await this.i18n.t('cv.NOT_FOUND'));
    }

    return { data: cv as any };
  }

  async updateCv(
    cvId: string,
    userId: string,
    data: UpdateCvInput,
  ): Promise<CvResponse> {
    await this.userService.findById(userId);

    const cv = await this.prisma.$transaction(async (tx) => {
      if (data.isDefault)
        await tx.cV.updateMany({
          where: { userId: userId, isDefault: true },
          data: { isDefault: false },
        });

      return tx.cV.update({
        where: { id: cvId, userId: userId },
        data: {
          ...(data.title && { title: data.title }),
          ...(data.isDefault !== undefined && { isDefault: data.isDefault }),
        },
      });
    });

    return {
      data: cv,
      message: await this.i18n.t('cv.UPDATED'),
    };
  }

  async deleteCv(cvId: string, userId: string): Promise<CvResponse> {
    await this.userService.findById(userId);

    await this.prisma.cV.delete({
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
}
