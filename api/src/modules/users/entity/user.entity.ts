import { CapitalTextField, EmailField } from '@bts-soft/core';
import { ObjectType, Field } from '@nestjs/graphql';
import { Exclude } from 'class-transformer';
import { Role } from 'src/common/constant/enum.constant';

@ObjectType()
export class User {
  @Field(() => String)
  id: string;

  @CapitalTextField('firstName')
  firstName?: string | null;

  @CapitalTextField('lastName')
  lastName?: string | null;

  @CapitalTextField('Headline')
  headline?: string | null;

  @Field(() => String)
  role: Role;

  @EmailField()
  email: string;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;

  password?: string | null;
  googleId?: string | null;
  resetToken?: string | null;
  resetTokenExpiry?: Date | null;
}
