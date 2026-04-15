import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { BaseResponse } from '@bts-soft/core';

@ObjectType()
export class ExportCvResponse extends BaseResponse {
  @Field(() => String, { nullable: true })
  @Expose()
  fileContent?: string; // Base64

  @Field(() => String, { nullable: true })
  @Expose()
  fileName?: string;
}
