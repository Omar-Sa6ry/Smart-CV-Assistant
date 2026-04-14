import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateExperienceInput } from './inputs/createExperience.input';
import { UpdateExperienceInput } from './inputs/updateExperience.input';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { ExperienceBuilderFactory } from './builder/experience-builder.factory';
import { ExperienceFactory } from './factory/experience.factory';
import {
  ExperienceResponse,
  ExperiencesResponse,
} from './dtos/experienceResponse.dto';

@Injectable()
export class ExperienceService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly builderFactory: ExperienceBuilderFactory,
  ) {}

  async createExperience(
    userId: string,
    data: CreateExperienceInput,
  ): Promise<ExperienceResponse> {
    const cv = await this.prisma.cv.findUnique({
      where: { id: data.cvId },
    });

    if (!cv || cv.userId !== userId)
      throw new ForbiddenException(await this.i18n.t('cv.NOT_PERMISSION'));

    const builder = this.builderFactory.create();
    const experienceData = builder
      .setJobTitle(data.jobTitle)
      .setCompanyName(data.companyName)
      .setCompanyWebsite(data.companyWebsite)
      .setLocation(data.location)
      .setStartDate(data.startDate)
      .setEndDate(data.endDate)
      .setIsCurrentJob(data.isCurrentJob || false)
      .setDescription(data.description)
      .setAchievements(data.achievements)
      .setEmploymentType(data.employmentType)
      .setUser(userId)
      .setCv(data.cvId)
      .build();

    const experience = await this.prisma.experience.create({
      data: experienceData as any,
      include: { cv: true, user: true },
    });

    return {
      data: ExperienceFactory.fromPrisma(experience),
      statusCode: 201,
      message: await this.i18n.t('experience.CREATED'),
    };
  }

  async getExperiencesByCvId(
    userId: string,
    cvId: string,
    pagination?: PaginationInput,
  ): Promise<ExperiencesResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [experiences, total] = await this.prisma.$transaction([
      this.prisma.experience.findMany({
        where: { cvId, userId },
        include: { cv: true, user: true },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.experience.count({ where: { cvId, userId } }),
    ]);

    return {
      items: ExperienceFactory.fromPrismaArray(experiences),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getExperiencesByUserId(
    userId: string,
    pagination?: PaginationInput,
  ): Promise<ExperiencesResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [experiences, total] = await this.prisma.$transaction([
      this.prisma.experience.findMany({
        where: { userId },
        include: { cv: true, user: true },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.experience.count({ where: { userId } }),
    ]);

    return {
      items: ExperienceFactory.fromPrismaArray(experiences),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getExperienceById(
    userId: string,
    id: string,
  ): Promise<ExperienceResponse> {
    const experience = await this.prisma.experience.findUnique({
      where: { id },
      include: { cv: true, user: true },
    });

    if (!experience || experience.userId !== userId) {
      throw new NotFoundException(await this.i18n.t('experience.NOT_FOUND'));
    }

    return { data: ExperienceFactory.fromPrisma(experience) };
  }

  async updateExperience(
    userId: string,
    id: string,
    data: UpdateExperienceInput,
  ): Promise<ExperienceResponse> {
    await this.getExperienceById(userId, id);

    const updated = await this.prisma.experience.update({
      where: { id },
      data: {
        jobTitle: data.jobTitle,
        companyName: data.companyName,
        companyWebsite: data.companyWebsite,
        location: data.location,
        startDate: data.startDate,
        endDate: data.endDate,
        isCurrentJob: data.isCurrentJob,
        description: data.description,
        achievements: data.achievements,
        employmentType: data.employmentType,
      },
      include: { cv: true, user: true },
    });

    return {
      data: ExperienceFactory.fromPrisma(updated),
      message: await this.i18n.t('experience.UPDATED'),
    };
  }

  async deleteExperience(
    userId: string,
    id: string,
  ): Promise<ExperienceResponse> {
    await this.getExperienceById(userId, id);

    await this.prisma.experience.delete({
      where: { id },
    });

    return {
      data: null,
      message: await this.i18n.t('experience.DELETED'),
    };
  }
}
