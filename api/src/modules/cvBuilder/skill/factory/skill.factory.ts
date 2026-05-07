import { Injectable } from '@nestjs/common';
import { Skill } from '../models/skill.model';
import { SkillKeyword } from '../models/skill-keyword.model';
import { Skill as PrismaSkill, User as PrismaUser, Cv as PrismaCv, SkillKeyword as PrismaSkillKeyword } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

type PrismaSkillWithRelations = PrismaSkill & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
  keyword?: PrismaSkillKeyword | null;
};

@Injectable()
export class SkillFactory {
  static fromPrisma(skill: PrismaSkillWithRelations): Skill {
    return plainToInstance(Skill, skill, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(skills: PrismaSkillWithRelations[]): Skill[] {
    return skills.map(skill => this.fromPrisma(skill));
  }

  static keywordFromPrisma(keyword: PrismaSkillKeyword): SkillKeyword {
    return plainToInstance(SkillKeyword, keyword, {
      excludeExtraneousValues: false,
    });
  }

  static keywordFromPrismaArray(keywords: PrismaSkillKeyword[]): SkillKeyword[] {
    return keywords.map(kw => this.keywordFromPrisma(kw));
  }
}
