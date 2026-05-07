import { Field, InputType } from '@nestjs/graphql';
import {
  IsString,
  IsOptional,
  IsUUID,
  IsDate,
  MaxLength,
} from 'class-validator';

@InputType()
export class CreateAwardInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  title: string;

  @Field(() => String)
  @IsString()
  @MaxLength(255)
  issuer: string;

  @Field(() => Date)
  @IsDate()
  issueDate: Date;

  @Field(() => String, { nullable: true })
  @IsOptional()
  @IsString()
  @MaxLength(2000)
  description?: string;
}
