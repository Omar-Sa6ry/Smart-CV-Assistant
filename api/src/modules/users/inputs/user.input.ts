import { EmailField } from '@bts-soft/core';
import { InputType } from '@nestjs/graphql';

@InputType()
export class EmailInput {
  @EmailField()
  email: string;
}
