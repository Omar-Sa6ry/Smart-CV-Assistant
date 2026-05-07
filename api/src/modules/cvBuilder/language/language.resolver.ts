import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { LanguageService } from './language.service';
import { Language } from './models/language.model';
import {
  LanguageResponse,
  LanguagesResponse,
} from './dtos/languageResponse.dto';
import { CreateLanguageInput } from './inputs/createLanguage.input';
import { UpdateLanguageInput } from './inputs/updateLanguage.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { LanguageLoader } from './loaders/language.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../cv/models/cv.model';

@Resolver(() => Language)
export class LanguageResolver {
  constructor(
    private readonly languageService: LanguageService,
    private readonly languageLoader: LanguageLoader,
  ) {}

  @Mutation(() => LanguageResponse)
  @Auth([Permission.CREATE_LANGUAGE])
  async createLanguage(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateLanguageInput,
  ): Promise<LanguageResponse> {
    return this.languageService.createLanguage(user.id, data);
  }

  @Query(() => LanguagesResponse)
  @Auth([Permission.GET_LANGUAGE])
  async getLanguagesByUserId(
    @CurrentUser() user: CurrentUserDto,
  ): Promise<LanguagesResponse> {
    return this.languageService.getLanguagesByUserId(user.id);
  }

  @Query(() => LanguagesResponse)
  @Auth([Permission.GET_LANGUAGE])
  async getLanguagesByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
  ): Promise<LanguagesResponse> {
    return this.languageService.getLanguagesByCvId(user.id, cvId);
  }

  @Query(() => LanguageResponse)
  @Auth([Permission.GET_LANGUAGE])
  async getLanguageById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<LanguageResponse> {
    return this.languageService.getLanguageById(user.id, id);
  }

  @Mutation(() => LanguageResponse)
  @Auth([Permission.UPDATE_LANGUAGE])
  async updateLanguage(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateLanguageInput,
  ): Promise<LanguageResponse> {
    return this.languageService.updateLanguage(user.id, id, data);
  }

  @Mutation(() => LanguageResponse, { nullable: true })
  @Auth([Permission.DELETE_LANGUAGE])
  async deleteLanguage(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<LanguageResponse | null> {
    return this.languageService.deleteLanguage(user.id, id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() language: Language): Promise<User | null> {
    return this.languageLoader.userLoader.load(language.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() language: Language): Promise<Cv | null> {
    return this.languageLoader.cvLoader.load(language.cvId);
  }
}
