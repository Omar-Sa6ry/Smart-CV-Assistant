import { Field, ObjectType } from '@nestjs/graphql';
import { GraphqlBaseResponse } from '@bts-soft/core';

@ObjectType()
export class ExportCvResponse extends GraphqlBaseResponse {
  @Field(() => String, { nullable: true })
  fileContent?: string; // Base64

  @Field(() => String, { nullable: true })
  fileName?: string;
}
