import { Field, InputType } from '@nestjs/graphql';
import {
  IsBoolean,
  IsOptional,
  IsPhoneNumber,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
} from 'class-validator';

@InputType()
export class CreateCvInput {
  @Field(() => String)
  @IsString()
  title: string;

  @Field(() => String)
  @IsString()
  headline: string;

  @Field(() => String)
  @IsString()
  location: string;

  @Field(() => String)
  @IsPhoneNumber('EG')
  phone: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  linkedin?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  github?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  portfolio?: string;

  @Field()
  @IsString()
  @MinLength(50, {
    message:
      'Professional summary is too short. Please write at least 50 characters.',
  })
  @MaxLength(2000, {
    message: 'Professional summary cannot exceed 2000 characters.',
  })
  summary: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
