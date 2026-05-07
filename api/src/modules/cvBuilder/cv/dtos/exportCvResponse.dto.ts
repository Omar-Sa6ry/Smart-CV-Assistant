import { Field, ObjectType } from '@nestjs/graphql';
import { BaseResponse } from '@bts-soft/core';

@ObjectType()
export class ExportCvResponse extends BaseResponse {
  @Field(() => String, { nullable: true })
  fileContent?: string; // Base64

  @Field(() => String, { nullable: true })
  fileName?: string;
}
