import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateEducationInput } from './inputs/createEducation.input';
import { UpdateEducationInput } from './inputs/updateEducation.input';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { EducationBuilderFactory } from './builder/education-builder.factory';
import { EducationFactory } from './factory/education.factory';
import {
  EducationResponse,
  EducationsResponse,
} from './dtos/educationResponse.dto';
import { CvService } from '../cv/cv.service';

@Injectable()
export class EducationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => CvService))
    private readonly cvService: CvService,
    private readonly builderFactory: EducationBuilderFactory,
  ) {}

  async createEducation(
    userId: string,
    data: CreateEducationInput,
  ): Promise<EducationResponse> {
    await this.cvService.getById(data.cvId, userId);

    const builder = this.builderFactory.create();
    const educationData = builder
      .setInstitution(data.institution)
      .setTitle(data.title)
      .setLocation(data.location)
      .setDescription(data.description)
      .setDegree(data.degree)
      .setGpa(data.gpa)
      .setIsCurrent(data.isCurrent || false)
      .setStartDate(data.startDate)
      .setEndDate(data.endDate)
      .setUser(userId)
      .setCv(data.cvId)
      .build();

    const education = await this.prisma.education.create({
      data: educationData as any,
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(data.cvId, userId, true);
    await this.cvService.invalidateCache(data.cvId, cvData.data);

    return {
      data: EducationFactory.fromPrisma(education),
      statusCode: 201,
      message: await this.i18n.t('education.CREATED'),
    };
  }

  async getEducationsByUserId(
    userId: string,
    pagination?: PaginationInput,
  ): Promise<EducationsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [educations, total] = await this.prisma.$transaction([
      this.prisma.education.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.education.count({ where: { userId } }),
    ]);

    return {
      items: EducationFactory.fromPrismaArray(educations),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getEducationsByCvId(
    userId: string,
    cvId: string,
    pagination?: PaginationInput,
  ): Promise<EducationsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [educations, total] = await this.prisma.$transaction([
      this.prisma.education.findMany({
        where: { cvId, userId },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.education.count({ where: { cvId, userId } }),
    ]);

    return {
      items: EducationFactory.fromPrismaArray(educations),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getEducationById(
    userId: string,
    id: string,
  ): Promise<EducationResponse> {
    const education = await this.prisma.education.findUnique({
      where: { id },
      include: { cv: true, user: true },
    });

    if (!education || education.userId !== userId) {
      throw new ForbiddenException(
        await this.i18n.t('education.NOT_PERMISSION'),
      );
    }

    return { data: EducationFactory.fromPrisma(education) };
  }

  async updateEducation(
    userId: string,
    id: string,
    data: UpdateEducationInput,
  ): Promise<EducationResponse> {
    await this.getEducationById(userId, id);

    if (data.cvId) await this.cvService.getById(data.cvId, userId);

    const updated = await this.prisma.education.update({
      where: { id },
      data: {
        institution: data.institution,
        title: data.title,
        location: data.location,
        description: data.description,
        degree: data.degree,
        gpa: data.gpa,
        isCurrent: data.isCurrent,
        startDate: data.startDate,
        endDate: data.endDate,
        cvId: data.cvId,
      },
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(updated.cvId, userId, true);
    await this.cvService.invalidateCache(updated.cvId, cvData.data);

    return {
      data: EducationFactory.fromPrisma(updated),
      message: await this.i18n.t('education.UPDATED'),
    };
  }

  async deleteEducation(
    userId: string,
    id: string,
  ): Promise<EducationResponse> {
    const educationRes = await this.getEducationById(userId, id);
    await this.prisma.education.delete({ where: { id } });

    const cvId = (educationRes.data as any).cvId;
    const cvData = await this.cvService.getById(cvId, userId, true);
    await this.cvService.invalidateCache(cvId, cvData.data);

    return {
      data: null,
      message: await this.i18n.t('education.DELETED'),
    };
  }
}
