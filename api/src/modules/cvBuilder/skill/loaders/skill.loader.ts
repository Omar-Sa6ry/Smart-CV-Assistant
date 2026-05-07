import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../../cv/models/cv.model';
import { Skill } from '../models/skill.model';
import { SkillKeyword } from '../models/skill-keyword.model';
import { SkillFactory } from '../factory/skill.factory';

@Injectable({ scope: Scope.REQUEST })
export class SkillLoader {
  constructor(private readonly prisma: PrismaService) {}

  public readonly userLoader = new DataLoader<string, User>(
    async (userIds: readonly string[]) => {
      const users = await this.prisma.user.findMany({
        where: { id: { in: [...userIds] } },
      });

      const userMap = new Map(users.map((user) => [user.id, user]));
      return userIds.map((id) => userMap.get(id) as User);
    },
  );

  public readonly cvLoader = new DataLoader<string, Cv>(
    async (cvIds: readonly string[]) => {
      const cvs = await this.prisma.cv.findMany({
        where: { id: { in: [...cvIds] } },
      });

      const cvMap = new Map(cvs.map((cv) => [cv.id, cv]));
      return cvIds.map((id) => cvMap.get(id) as Cv);
    },
  );

  public readonly keywordLoader = new DataLoader<string, SkillKeyword>(
    async (keywordIds: readonly string[]) => {
      const ids = [...keywordIds].filter(id => !!id);
      const keywords = await this.prisma.skillKeyword.findMany({
        where: { id: { in: ids } },
      });

      const keywordMap = new Map(keywords.map((kw) => [kw.id, SkillFactory.keywordFromPrisma(kw)]));
      return keywordIds.map((id) => id ? keywordMap.get(id) as SkillKeyword : null as any);
    },
  );

  public readonly skillsByCvIdLoader = new DataLoader<string, Skill[]>(
    async (cvIds: readonly string[]) => {
      const skills = await this.prisma.skill.findMany({
        where: { cvId: { in: [...cvIds] } },
        include: { keyword: true },
      });

      const skillMap = new Map<string, Skill[]>();
      skills.forEach((skill) => {
        const list = skillMap.get(skill.cvId) || [];
        list.push(SkillFactory.fromPrisma(skill));
        skillMap.set(skill.cvId, list);
      });

      return cvIds.map((id) => skillMap.get(id) || []);
    },
  );
}
