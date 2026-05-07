import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ProjectService } from './project.service';
import { Project } from './models/project.model';
import { ProjectResponse, ProjectsResponse } from './dtos/projectResponse.dto';
import { CreateProjectInput } from './inputs/createProject.input';
import { UpdateProjectInput } from './inputs/updateProject.input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { ProjectLoader } from './loaders/project.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../cv/models/cv.model';

@Resolver(() => Project)
export class ProjectResolver {
  constructor(
    private readonly projectService: ProjectService,
    private readonly projectLoader: ProjectLoader,
  ) {}

  @Mutation(() => ProjectResponse)
  @Auth([Permission.CREATE_PROJECT])
  async createProject(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateProjectInput,
  ): Promise<ProjectResponse> {
    return this.projectService.createProject(user.id, data);
  }

  @Query(() => ProjectsResponse)
  @Auth([Permission.GET_PROJECT])
  async getProjectsByUserId(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<ProjectsResponse> {
    return this.projectService.getProjectsByUserId(user.id, pagination);
  }

  @Query(() => ProjectsResponse)
  @Auth([Permission.GET_PROJECT])
  async getProjectsByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<ProjectsResponse> {
    return this.projectService.getProjectsByCvId(user.id, cvId, pagination);
  }

  @Query(() => ProjectResponse)
  @Auth([Permission.GET_PROJECT])
  async getProjectById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<ProjectResponse> {
    return this.projectService.getProjectById(user.id, id);
  }

  @Mutation(() => ProjectResponse)
  @Auth([Permission.UPDATE_PROJECT])
  async updateProject(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateProjectInput,
  ): Promise<ProjectResponse> {
    return this.projectService.updateProject(user.id, id, data);
  }

  @Mutation(() => ProjectResponse, { nullable: true })
  @Auth([Permission.DELETE_PROJECT])
  async deleteProject(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<ProjectResponse | null> {
    return this.projectService.deleteProject(user.id, id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() project: Project): Promise<User | null> {
    return this.projectLoader.userLoader.load(project.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() project: Project): Promise<Cv | null> {
    return this.projectLoader.cvLoader.load(project.cvId);
  }

  @ResolveField(() => [String], { name: 'descriptionBullets' })
  async getDescriptionBullets(@Parent() project: Project): Promise<string[]> {
    if (!project.description) return [];
    return project.description
      .split('\n')
      .map((bullet) => bullet.trim())
      .filter((bullet) => bullet.length > 0);
  }
}
