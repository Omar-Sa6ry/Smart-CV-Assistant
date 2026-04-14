import { Field, InputType, Float } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  IsBoolean,
  Min,
  Max,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Degree } from '@prisma/client';

@InputType()
export class CreateEducationInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(75)
  institution: string;

  @Field(() => String)
  @IsString()
  @MaxLength(150)
  title: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @Field(() => Degree)
  @IsEnum(Degree)
  degree: Degree;

  @Field(() => Float, { nullable: true })
  @IsOptional()
  @Min(0)
  @Max(4)
  gpa?: number;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  @IsOptional()
  isCurrent?: boolean;

  @Field(() => Date)
  @IsDate()
  startDate: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
