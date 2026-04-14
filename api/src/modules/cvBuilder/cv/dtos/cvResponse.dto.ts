import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { Cv } from '../models/cv.model';

@ObjectType()
export class CvResponse extends BaseResponse {
  @Field(() => Cv, { nullable: true })
  @Expose()
  data?: Cv | null;
}

@ObjectType()
export class CvsResponse extends BaseResponse {
  @Field(() => [Cv], { nullable: true })
  items: Cv[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}
