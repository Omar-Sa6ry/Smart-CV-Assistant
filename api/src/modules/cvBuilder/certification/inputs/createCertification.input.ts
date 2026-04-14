import { Field, InputType } from '@nestjs/graphql';
import { IsString, IsOptional, IsUUID, IsDate, MaxLength, IsUrl } from 'class-validator';

@InputType()
export class CreateCertificationInput {
  @Field(() => String)
  @IsUUID()
  cvId: string;

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
