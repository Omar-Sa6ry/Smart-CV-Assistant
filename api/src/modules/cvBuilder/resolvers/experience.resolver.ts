import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { ExperienceService } from '../services/experience.service';
import { Experience } from '../models/experience.model';
import {
  ExperienceResponse,
  ExperiencesResponse,
} from '../dtos/experienceResponse.dto';
import { CreateExperienceInput } from '../inputs/createExperience.input';
import { UpdateExperienceInput } from '../inputs/updateExperience.input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { ExperienceLoader } from '../loaders/experience.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../models/cv.model';

@Resolver(() => Experience)
export class ExperienceResolver {
  constructor(
    private readonly experienceService: ExperienceService,
    private readonly experienceLoader: ExperienceLoader,
  ) {}

  @Mutation(() => ExperienceResponse)
  @Auth([Permission.CREATE_EXPERIENCE])
  async createExperience(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateExperienceInput,
  ): Promise<ExperienceResponse> {
    return this.experienceService.createExperience(user.id, data);
  }

  @Query(() => ExperiencesResponse)
  @Auth([Permission.GET_EXPERIENCE])
  async getExperiencesByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<ExperiencesResponse> {
    return this.experienceService.getExperiencesByCvId(
      user.id,
      cvId,
      pagination,
    );
  }

  @Query(() => ExperiencesResponse)
  @Auth([Permission.GET_EXPERIENCE])
  async getExperiencesByUserId(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<ExperiencesResponse> {
    return this.experienceService.getExperiencesByUserId(user.id, pagination);
  }

  @Query(() => ExperienceResponse)
  @Auth([Permission.GET_EXPERIENCE])
  async getExperienceById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<ExperienceResponse> {
    return this.experienceService.getExperienceById(user.id, id);
  }

  @Mutation(() => ExperienceResponse)
  @Auth([Permission.UPDATE_EXPERIENCE])
  async updateExperience(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateExperienceInput,
  ): Promise<ExperienceResponse> {
    return this.experienceService.updateExperience(user.id, id, data);
  }

  @Mutation(() => ExperienceResponse, { nullable: true })
  @Auth([Permission.DELETE_EXPERIENCE])
  async deleteExperience(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<ExperienceResponse | null> {
    return this.experienceService.deleteExperience(user.id, id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() experience: Experience): Promise<User | null> {
    return this.experienceLoader.userLoader.load(experience.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() experience: Experience): Promise<Cv | null> {
    return this.experienceLoader.cvLoader.load(experience.cvId);
  }

  @ResolveField(() => [String], { name: 'descriptionBullets' })
  async getDescriptionBullets(@Parent() experience: Experience): Promise<string[]> {
    if (!experience.description) return [];
    return experience.description
      .split('\n')
      .map((bullet) => bullet.trim())
      .filter((bullet) => bullet.length > 0);
  }
}
