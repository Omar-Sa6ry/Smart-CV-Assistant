import { Field, InputType, Int } from '@nestjs/graphql';
import { IsString, IsOptional, IsUUID, IsDate, MaxLength, IsBoolean, IsInt, Min } from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

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
