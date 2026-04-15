import { Injectable } from '@nestjs/common';
import { StandardSkillBuilder } from './standard-skill.builder';
import { ISkillBuilder } from '../interfaces/iskill.interface';

@Injectable()
export class SkillBuilderFactory {
  create(): ISkillBuilder {
    return new StandardSkillBuilder();
  }
}
