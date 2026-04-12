import { Field, InputType } from '@nestjs/graphql';

@InputType()
export class CreateCvInput {
  @Field(() => String)
  title: string;

  @Field(() => Boolean, { nullable: true })
  isDefault?: boolean;
}
