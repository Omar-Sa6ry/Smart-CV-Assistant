import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { IsOptional } from 'class-validator';
import { BaseResponse, PaginationInfo } from '@bts-soft/core';
import { Certification } from '../models/certification.model';

@ObjectType()
export class CertificationResponse extends BaseResponse {
  @Field(() => Certification, { nullable: true })
  @Expose()
  data?: Certification | null;
}

@ObjectType()
export class CertificationsResponse extends BaseResponse {
  @Field(() => [Certification], { nullable: true })
  items: Certification[];

  @IsOptional()
  @Field(() => PaginationInfo, { nullable: true })
  pagination?: PaginationInfo;
}
