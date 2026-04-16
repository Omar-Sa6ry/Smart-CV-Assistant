import { ISkillBuilder } from '../interfaces/iskill.interface';
import { Skill } from '../models/skill.model';
import { SkillProficiency } from '@prisma/client';

export class StandardSkillBuilder implements ISkillBuilder {
  private skill: Partial<Skill>;

  constructor() {
    this.reset();
  }

  reset(): this {
    this.skill = {};
    return this;
  }

  setName(name: string): this {
    this.skill.name = name;
    return this;
  }

  setProficiency(proficiency: SkillProficiency): this {
    this.skill.proficiency = proficiency;
    return this;
  }

  setUser(userId: string): this {
    (this.skill as any).userId = userId;
    return this;
  }

  setCv(cvId: string): this {
    (this.skill as any).cvId = cvId;
    return this;
  }

  setKeyword(keywordId: string | null): this {
    (this.skill as any).keywordId = keywordId;
    return this;
  }

  build(): Partial<Skill> {
    const result = { ...this.skill };
    this.reset();
    return result;
  }
}
