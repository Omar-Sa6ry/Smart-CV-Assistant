import { Field, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  MaxLength,
  IsBoolean,
} from 'class-validator';

@InputType()
export class CreateProjectInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(150)
  name: string;

  @Field(() => String)
  @IsString()
  @MaxLength(2000)
  description: string;

  @Field(() => String)
  @IsString()
  @MaxLength(500)
  projectUrl: string;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  startDate?: Date;

  @Field(() => Date, { nullable: true })
  @IsOptional()
  @IsDate()
  endDate?: Date;
}
