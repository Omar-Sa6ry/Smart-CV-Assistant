import { EmailField, PasswordField, CapitalTextField } from '@bts-soft/core';
import { InputType } from '@nestjs/graphql';

@InputType()
export class CreateUserDto {
  @CapitalTextField('First name')
  firstName: string;

  @CapitalTextField('Last name')
  lastName: string;

  @CapitalTextField('Headline')
  headline: string;

  @EmailField()
  email: string;

  @PasswordField()
  password: string;
}
