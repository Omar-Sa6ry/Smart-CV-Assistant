import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

@InputType()
export class CreateCvInput {
  @Field(() => String)
  @IsString()
  title: string;

  @Field()
  @IsString()
  @MinLength(50, {
    message:
      'Professional summary is too short. Please write at least 50 characters.',
  })
  @MaxLength(1000, {
    message: 'Professional summary cannot exceed 1000 characters.',
  })
  summary: string;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isDefault?: boolean;
}
