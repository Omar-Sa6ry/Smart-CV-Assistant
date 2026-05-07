import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsUUID, MaxLength, IsEnum } from 'class-validator';
import { Proficiency } from '@prisma/client';

@InputType()
export class CreateLanguageInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

  @Field(() => String)
  @IsString()
  @MaxLength(100)
  name: string;

  @Field(() => Proficiency, { defaultValue: Proficiency.professional })
  @IsEnum(Proficiency)
  proficiency: Proficiency;
}
