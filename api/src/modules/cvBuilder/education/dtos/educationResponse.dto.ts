import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { GraphqlBaseResponse, PaginationInfo } from '@bts-soft/core';
import { Education } from '../models/education.model';

@ObjectType()
export class EducationResponse extends GraphqlBaseResponse {
  @Field(() => Education, { nullable: true })
  @Expose()
  data?: Education | null;
}

@ObjectType()
export class EducationsResponse extends GraphqlBaseResponse {
  @Field(() => [Education], { nullable: true })
  items: Education[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}
