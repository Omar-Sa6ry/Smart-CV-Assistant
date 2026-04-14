import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { EducationService } from './education.service';
import { Education } from './models/education.model';
import {
  EducationResponse,
  EducationsResponse,
} from './dtos/educationResponse.dto';
import { CreateEducationInput } from './inputs/createEducation.input';
import { UpdateEducationInput } from './inputs/updateEducation.input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { EducationLoader } from './loaders/education.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../cv/models/cv.model';

@Resolver(() => Education)
export class EducationResolver {
  constructor(
    private readonly educationService: EducationService,
    private readonly educationLoader: EducationLoader,
  ) {}

  @Mutation(() => EducationResponse)
  @Auth([Permission.CREATE_EDUCATION])
  async createEducation(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateEducationInput,
  ): Promise<EducationResponse> {
    return this.educationService.createEducation(user.id, data);
  }

  @Query(() => EducationsResponse)
  @Auth([Permission.GET_EDUCATION])
  async getEducationsByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<EducationsResponse> {
    return this.educationService.getEducationsByCvId(user.id, cvId, pagination);
  }

  @Query(() => EducationsResponse)
  @Auth([Permission.GET_EDUCATION])
  async getEducationsByUserId(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<EducationsResponse> {
    return this.educationService.getEducationsByUserId(user.id, pagination);
  }

  @Query(() => EducationResponse)
  @Auth([Permission.GET_EDUCATION])
  async getEducationById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<EducationResponse> {
    return this.educationService.getEducationById(user.id, id);
  }

  @Mutation(() => EducationResponse)
  @Auth([Permission.UPDATE_EDUCATION])
  async updateEducation(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateEducationInput,
  ): Promise<EducationResponse> {
    return this.educationService.updateEducation(user.id, id, data);
  }

  @Mutation(() => EducationResponse, { nullable: true })
  @Auth([Permission.DELETE_EDUCATION])
  async deleteEducation(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<EducationResponse | null> {
    return this.educationService.deleteEducation(user.id, id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() education: Education): Promise<User | null> {
    return this.educationLoader.userLoader.load(education.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() education: Education): Promise<Cv | null> {
    return this.educationLoader.cvLoader.load(education.cvId);
  }
}
