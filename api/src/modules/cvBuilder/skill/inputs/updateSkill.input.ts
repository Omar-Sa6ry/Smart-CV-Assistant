import { InputType, PartialType, OmitType } from '@nestjs/graphql';
import { CreateSkillInput } from './createSkill.input';

@InputType()
export class UpdateSkillInput extends PartialType(CreateSkillInput) {}
