import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateProjectInput } from './inputs/createProject.input';
import { UpdateProjectInput } from './inputs/updateProject.input';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { ProjectBuilderFactory } from './builder/project-builder.factory';
import { ProjectFactory } from './factory/project.factory';
import { ProjectResponse, ProjectsResponse } from './dtos/projectResponse.dto';
import { CvService } from '../cv/cv.service';

@Injectable()
export class ProjectService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => CvService))
    private readonly cvService: CvService,
    private readonly builderFactory: ProjectBuilderFactory,
  ) {}

  async createProject(
    userId: string,
    data: CreateProjectInput,
  ): Promise<ProjectResponse> {
    await this.cvService.getById(data.cvId, userId);

    const builder = this.builderFactory.create();
    const projectData = builder
      .setName(data.name)
      .setDescription(data.description)
      .setProjectUrl(data.projectUrl)
      .setStartDate(data.startDate)
      .setEndDate(data.endDate)
      .setUser(userId)
      .setCv(data.cvId)
      .build();

    const project = await this.prisma.project.create({
      data: projectData as any,
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(data.cvId, userId, true);
    await this.cvService.invalidateCache(data.cvId, cvData.data);

    return {
      data: ProjectFactory.fromPrisma(project),
      statusCode: 201,
      message: await this.i18n.t('project.CREATED'),
    };
  }

  async getProjectsByUserId(
    userId: string,
    pagination?: PaginationInput,
  ): Promise<ProjectsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { userId },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where: { userId } }),
    ]);

    return {
      items: ProjectFactory.fromPrismaArray(projects),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getProjectsByCvId(
    userId: string,
    cvId: string,
    pagination?: PaginationInput,
  ): Promise<ProjectsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [projects, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { cvId, userId },
        orderBy: { startDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where: { cvId, userId } }),
    ]);

    return {
      items: ProjectFactory.fromPrismaArray(projects),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getProjectById(userId: string, id: string): Promise<ProjectResponse> {
    const project = await this.prisma.project.findUnique({
      where: { id },
      include: { cv: true, user: true },
    });

    if (!project || project.userId !== userId) {
      throw new NotFoundException(await this.i18n.t('project.NOT_FOUND'));
    }

    return { data: ProjectFactory.fromPrisma(project) };
  }

  async updateProject(
    userId: string,
    id: string,
    data: UpdateProjectInput,
  ): Promise<ProjectResponse> {
    await this.getProjectById(userId, id);

    const updated = await this.prisma.project.update({
      where: { id },
      data: {
        name: data.name,
        description: data.description,
        projectUrl: data.projectUrl,
        startDate: data.startDate,
        endDate: data.endDate,
      },
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(updated.cvId, userId, true);
    await this.cvService.invalidateCache(updated.cvId, cvData.data);

    return {
      data: ProjectFactory.fromPrisma(updated),
      message: await this.i18n.t('project.UPDATED'),
    };
  }

  async deleteProject(userId: string, id: string): Promise<ProjectResponse> {
    const projectRes = await this.getProjectById(userId, id);
    await this.prisma.project.delete({ where: { id } });

    const cvId = (projectRes.data as any).cvId;
    const cvData = await this.cvService.getById(cvId, userId, true);
    await this.cvService.invalidateCache(cvId, cvData.data);

    return {
      data: null,
      message: await this.i18n.t('project.DELETED'),
    };
  }
}
