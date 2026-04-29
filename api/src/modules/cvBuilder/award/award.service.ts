import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateAwardInput } from './inputs/createAward.input';
import { UpdateAwardInput } from './inputs/updateAward.input';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { AwardBuilderFactory } from './builder/award-builder.factory';
import { AwardFactory } from './factory/award.factory';
import {
  AwardResponse,
  AwardsResponse,
} from './dtos/awardResponse.dto';
import { CvService } from '../cv/cv.service';

@Injectable()
export class AwardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => CvService))
    private readonly cvService: CvService,
    private readonly builderFactory: AwardBuilderFactory,
  ) {}

  async createAward(
    userId: string,
    data: CreateAwardInput,
  ): Promise<AwardResponse> {
    await this.cvService.getById(data.cvId, userId);

    const builder = this.builderFactory.create();

    const issueDate = new Date(data.issueDate);
    if (isNaN(issueDate.getTime())) {
      throw new BadRequestException('Invalid issue date format');
    }

    const awardData = builder
      .setTitle(data.title)
      .setIssuer(data.issuer)
      .setIssueDate(issueDate)
      .setDescription(data.description)
      .setUser(userId)
      .setCv(data.cvId)
      .build();

    const award = await this.prisma.award.create({
      data: awardData as any,
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(data.cvId, userId, true);
    await this.cvService.invalidateCache(data.cvId, cvData.data);

    return {
      data: AwardFactory.fromPrisma(award),
      statusCode: 201,
      message: await this.i18n.t('award.CREATED'),
    };
  }

  async getAwardsByCvId(
    userId: string,
    cvId: string,
    pagination?: PaginationInput,
  ): Promise<AwardsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [awards, total] = await this.prisma.$transaction([
      this.prisma.award.findMany({
        where: { cvId, userId },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.award.count({ where: { cvId, userId } }),
    ]);

    return {
      items: AwardFactory.fromPrismaArray(awards),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getAwardsByUserId(
    userId: string,
    pagination?: PaginationInput,
  ): Promise<AwardsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [awards, total] = await this.prisma.$transaction([
      this.prisma.award.findMany({
        where: { userId },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.award.count({ where: { userId } }),
    ]);

    return {
      items: AwardFactory.fromPrismaArray(awards),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getAwardById(
    userId: string,
    id: string,
  ): Promise<AwardResponse> {
    const award = await this.prisma.award.findUnique({
      where: { id },
      include: { cv: true, user: true },
    });

    if (!award || award.userId !== userId) {
      throw new NotFoundException(await this.i18n.t('award.NOT_FOUND'));
    }

    return { data: AwardFactory.fromPrisma(award) };
  }

  async updateAward(
    userId: string,
    id: string,
    data: UpdateAwardInput,
  ): Promise<AwardResponse> {
    await this.getAwardById(userId, id);

    const updated = await this.prisma.award.update({
      where: { id },
      data: {
        title: data.title,
        issuer: data.issuer,
        issueDate: data.issueDate,
        description: data.description,
      },
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(updated.cvId, userId, true);
    await this.cvService.invalidateCache(updated.cvId, cvData.data);

    return {
      data: AwardFactory.fromPrisma(updated),
      message: await this.i18n.t('award.UPDATED'),
    };
  }

  async deleteAward(
    userId: string,
    id: string,
  ): Promise<AwardResponse> {
    const awardRes = await this.getAwardById(userId, id);
    await this.prisma.award.delete({ where: { id } });

    const cvId = (awardRes.data as any).cvId;
    const cvData = await this.cvService.getById(cvId, userId, true);
    await this.cvService.invalidateCache(cvId, cvData.data);

    return {
      data: null,
      message: await this.i18n.t('award.DELETED'),
    };
  }
}
