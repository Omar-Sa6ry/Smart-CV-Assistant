import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { CvService } from '../services/cv.service';
import { Cv } from '../models/cv.model';
import { CvResponse, CvsResponse } from '../dtos/cvResponse.dto';
import { CreateCvInput } from '../inputs/createCv.Input';
import { UpdateCvInput } from '../inputs/updateCv.Input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';

@Resolver(() => Cv)
export class CvResolver {
  constructor(private readonly cvService: CvService) {}

  @Mutation(() => CvResponse)
  @Auth([Permission.CREATE_CV])
  async createCv(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateCvInput,
  ): Promise<CvResponse> {
    return this.cvService.createCv(user.id, data);
  }

  @Query(() => CvsResponse)
  @Auth([Permission.GET_USERS_CV])
  async getUserCvs(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination') pagination: PaginationInput,
  ): Promise<CvsResponse> {
    return this.cvService.getUserCvs(user.id, pagination);
  }

  @Query(() => CvResponse)
  @Auth([Permission.UPDATE_CV])
  async getCvById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<CvResponse> {
    return this.cvService.getById(id, user.id);
  }

  @Mutation(() => CvResponse)
  @Auth([Permission.DELETE_CV])
  async updateCv(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateCvInput,
  ): Promise<CvResponse> {
    return this.cvService.updateCv(id, user.id, data);
  }
}
