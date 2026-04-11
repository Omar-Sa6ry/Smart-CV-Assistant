import { CapitalTextField, EmailField } from '@bts-soft/core';
import { ObjectType, Field } from '@nestjs/graphql';
import { Exclude } from 'class-transformer';
import { Role } from 'src/common/constant/enum.constant';

@ObjectType()
export class User {
  @Field(() => String)
  id: string;

  @Field(() => String, { nullable: true })
  @CapitalTextField('firstName')
  firstName?: string | null;

  @Field(() => String, { nullable: true })
  @CapitalTextField('lastName')
  lastName?: string | null;

  @Field(() => String)
  @CapitalTextField('Headline')
  headline?: string | null;

  @Field(() => String)
  @EmailField()
  email: string;

  @Exclude()
  password?: string | null;

  @Exclude()
  googleId?: string | null;

  @Exclude()
  role: Role;

  @Exclude()
  resetToken?: string | null;

  @Exclude()
  resetTokenExpiry?: Date | null;

  @Field(() => Date, { nullable: true })
  lastLoginAt?: Date | null;

  @Field(() => Date, { nullable: true })
  createdAt?: Date | null;

  @Field(() => Date, { nullable: true })
  updatedAt?: Date | null;
}
