import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { SkillService } from './skill.service';
import { Skill } from './models/skill.model';
import { SkillKeyword } from './models/skill-keyword.model';
import { SkillResponse, SkillsResponse } from './dtos/skillResponse.dto';
import { SkillKeywordsResponse } from './dtos/skill-keywordResponse.dto';
import { CreateSkillInput } from './inputs/createSkill.input';
import { UpdateSkillInput } from './inputs/updateSkill.input';
import { SearchSkillKeywordInput } from './inputs/searchSkillKeyword.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { SkillLoader } from './loaders/skill.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../cv/models/cv.model';
import { PaginationInput } from 'src/common/inputs/pagination.input';

@Resolver(() => Skill)
export class SkillResolver {
  constructor(
    private readonly skillService: SkillService,
    private readonly skillLoader: SkillLoader,
  ) {}

  @Mutation(() => SkillResponse)
  @Auth([Permission.CREATE_SKILL])
  async createSkill(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateSkillInput,
  ): Promise<SkillResponse> {
    return this.skillService.createSkill(user.id, data);
  }

  @Query(() => SkillsResponse)
  @Auth([Permission.GET_SKILL])
  async getSkillsByUserId(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<SkillsResponse> {
    return this.skillService.getSkillsByUserId(user.id);
  }

  @Query(() => SkillsResponse)
  @Auth([Permission.GET_SKILL])
  async getSkillsByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
  ): Promise<SkillsResponse> {
    return this.skillService.getSkillsByCvId(user.id, cvId);
  }

  @Query(() => SkillResponse)
  @Auth([Permission.GET_SKILL])
  async getSkillById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<SkillResponse> {
    return this.skillService.getSkillById(user.id, id);
  }

  @Mutation(() => SkillResponse)
  @Auth([Permission.UPDATE_SKILL])
  async updateSkill(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateSkillInput,
  ): Promise<SkillResponse> {
    return this.skillService.updateSkill(user.id, id, data);
  }

  @Mutation(() => SkillResponse, { nullable: true })
  @Auth([Permission.DELETE_SKILL])
  async deleteSkill(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<SkillResponse | null> {
    return this.skillService.deleteSkill(user.id, id);
  }

  @Query(() => SkillKeywordsResponse)
  @Auth([Permission.GET_SKILL])
  async searchSkillKeywords(
    @Args('data') data: SearchSkillKeywordInput,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<SkillKeywordsResponse> {
    return this.skillService.searchKeywords(data, pagination);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() skill: Skill): Promise<User | null> {
    return this.skillLoader.userLoader.load(skill.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() skill: Skill): Promise<Cv | null> {
    return this.skillLoader.cvLoader.load(skill.cvId);
  }

  @ResolveField(() => SkillKeyword, { name: 'keyword', nullable: true })
  async getKeyword(@Parent() skill: Skill): Promise<SkillKeyword | null> {
    if (!skill.keywordId) return null;
    return this.skillLoader.keywordLoader.load(skill.keywordId);
  }
}
