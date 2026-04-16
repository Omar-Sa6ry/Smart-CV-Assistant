import { Field, InputType, Float, Int } from '@nestjs/graphql';
import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsDate,
  IsUrl,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { CreateCvInput } from './createCv.Input';
import {
  EmploymentType,
  Degree,
  Proficiency,
  SkillProficiency,
  SkillCategory,
} from '@prisma/client';
import '../../experience/models/experience.model';
import '../../education/models/education.model';
import '../../language/models/language.model';
import '../../skill/models/skill.model';

@InputType()
export class ExperienceNestedInput {
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

@InputType()
export class EducationNestedInput {
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

@InputType()
export class ProjectNestedInput {
  @Field(() => String)
  @IsString()
  @MaxLength(150)
  name: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(250)
  description?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  technologiesUsed?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  projectUrl?: string;

  @Field(() => Boolean, { defaultValue: true })
  @IsBoolean()
  isPersonalProject: boolean;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;

  @Field(() => Boolean, { defaultValue: false })
  @IsBoolean()
  isTeamProject: boolean;

  @Field(() => Int, { defaultValue: 1 })
  @IsInt()
  @Min(1)
  teamSize: number;
}

@InputType()
export class CertificationNestedInput {
  @Field(() => String)
  @IsString()
  @MaxLength(255)
  name: string;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  issuingOrganization: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  credentialId?: string;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsUrl()
  @MaxLength(250)
  credentialUrl?: string;

  @Field(() => Date)
  @IsDate()
  issueDate: Date;
}

@InputType()
export class LanguageNestedInput {
  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name: string;

  @Field(() => Proficiency, { defaultValue: Proficiency.professional })
  @IsEnum(Proficiency)
  proficiency: Proficiency;
}

@InputType()
export class SkillNestedInput {
  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name: string;

  @Field(() => SkillCategory, { defaultValue: SkillCategory.technical })
  @IsEnum(SkillCategory)
  category: SkillCategory;

  @Field(() => SkillProficiency, { defaultValue: SkillProficiency.intermediate })
  @IsEnum(SkillProficiency)
  proficiency: SkillProficiency;

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(0)
  yearsOfExperience?: number;
}

@InputType()
export class CreateFullCvInput extends CreateCvInput {
  @Field(() => [ExperienceNestedInput], { nullable: true })
  @IsOptional()
  experiences?: ExperienceNestedInput[];

  @Field(() => [EducationNestedInput], { nullable: true })
  @IsOptional()
  educations?: EducationNestedInput[];

  @Field(() => [ProjectNestedInput], { nullable: true })
  @IsOptional()
  projects?: ProjectNestedInput[];

  @Field(() => [CertificationNestedInput], { nullable: true })
  @IsOptional()
  certifications?: CertificationNestedInput[];

  @Field(() => [LanguageNestedInput], { nullable: true })
  @IsOptional()
  languages?: LanguageNestedInput[];

  @Field(() => [SkillNestedInput], { nullable: true })
  @IsOptional()
  skills?: SkillNestedInput[];
}
