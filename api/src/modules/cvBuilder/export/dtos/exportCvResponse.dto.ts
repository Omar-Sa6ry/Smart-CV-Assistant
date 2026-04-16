import { Field, ObjectType } from '@nestjs/graphql';
import { Expose } from 'class-transformer';
import { BaseResponse } from '@bts-soft/core';

@ObjectType()
export class ExportCvData {
  @Field(() => String, { nullable: true })
  fileContent?: string;

  @Field(() => String, { nullable: true })
  fileName?: string;

  @Field(() => String, { nullable: true })
  downloadUrl?: string;
}

@ObjectType()
export class ExportCvResponse extends BaseResponse {
  @Field(() => ExportCvData, { nullable: true })
  @Expose()
  data?: ExportCvData;
}
