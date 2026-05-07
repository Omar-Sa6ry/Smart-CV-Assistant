import { CapitalTextField } from '@bts-soft/core';
import { Field, InputType } from '@nestjs/graphql';
import { IsOptional } from 'class-validator';

@InputType()
export class UpdateUserDto {
  @IsOptional()
  @CapitalTextField('First name', 5, 100, true)
  firstName?: string;

  @IsOptional()
  @CapitalTextField('Last name', 5, 100, true)
  lastName?: string;

  @IsOptional()
  @CapitalTextField('Headline', 5, 100, true)
  headline?: string;
}
