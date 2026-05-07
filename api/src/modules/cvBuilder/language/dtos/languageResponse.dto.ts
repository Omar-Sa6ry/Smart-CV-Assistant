import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { Language } from '../models/language.model';

@ObjectType()
export class LanguageResponse extends BaseResponse {
  @Field(() => Language, { nullable: true })
  @Expose()
  data?: Language | null;
}

@ObjectType()
export class LanguagesResponse extends BaseResponse {
  @Field(() => [Language], { nullable: true })
  items: Language[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}
