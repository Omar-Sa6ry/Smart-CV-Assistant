import { Field, InputType, Int } from '@nestjs/graphql';

@InputType()
export class PaginationInput {
  @Field(() => Int)
  limit: number;

  @Field(() => Int)
  page: number;
}
