import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { AwardService } from './award.service';
import { Award } from './models/award.model';
import {
  AwardResponse,
  AwardsResponse,
} from './dtos/awardResponse.dto';
import { CreateAwardInput } from './inputs/createAward.input';
import { UpdateAwardInput } from './inputs/updateAward.input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { AwardLoader } from './loaders/award.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../cv/models/cv.model';

@Resolver(() => Award)
export class AwardResolver {
  constructor(
    private readonly awardService: AwardService,
    private readonly awardLoader: AwardLoader,
  ) {}

  @Mutation(() => AwardResponse)
  @Auth([Permission.CREATE_AWARD])
  async createAward(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateAwardInput,
  ): Promise<AwardResponse> {
    return this.awardService.createAward(user.id, data);
  }

  @Query(() => AwardsResponse)
  @Auth([Permission.GET_AWARD])
  async getAwardsByUserId(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<AwardsResponse> {
    return this.awardService.getAwardsByUserId(
      user.id,
      pagination,
    );
  }

  @Query(() => AwardsResponse)
  @Auth([Permission.GET_AWARD])
  async getAwardsByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<AwardsResponse> {
    return this.awardService.getAwardsByCvId(
      user.id,
      cvId,
      pagination,
    );
  }

  @Query(() => AwardResponse)
  @Auth([Permission.GET_AWARD])
  async getAwardById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<AwardResponse> {
    return this.awardService.getAwardById(user.id, id);
  }

  @Mutation(() => AwardResponse)
  @Auth([Permission.UPDATE_AWARD])
  async updateAward(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateAwardInput,
  ): Promise<AwardResponse> {
    return this.awardService.updateAward(user.id, id, data);
  }

  @Mutation(() => AwardResponse, { nullable: true })
  @Auth([Permission.DELETE_AWARD])
  async deleteAward(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<AwardResponse | null> {
    return this.awardService.deleteAward(user.id, id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() award: Award): Promise<User | null> {
    return this.awardLoader.userLoader.load(award.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() award: Award): Promise<Cv | null> {
    return this.awardLoader.cvLoader.load(award.cvId);
  }
}
