import { Field, InputType } from '@nestjs/graphql';
import { IsBoolean, IsEnum, IsOptional, IsString, MaxLength, MinLength, IsDate, IsUrl } from 'class-validator';
import { EmploymentType } from '../models/experience.model';

@InputType()
export class CreateExperienceInput {
  @Field(() => String)
  @IsString()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MinLength(3)
  @MaxLength(75)
  jobTitle: string;

  @Field(() => String)
  @IsString()
  @MinLength(2)
  @MaxLength(150)
  companyName: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(250)
  companyWebsite?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  location?: string;

  @Field(() => Date)
  @IsDate()
  startDate: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => Boolean, { nullable: true })
  @IsOptional()
  @IsBoolean()
  isCurrentJob?: boolean;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  description: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  achievements?: string;

  @Field(() => EmploymentType)
  @IsEnum(EmploymentType)
  employmentType: EmploymentType;
}
