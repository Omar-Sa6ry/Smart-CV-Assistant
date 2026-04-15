import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../../cv/models/cv.model';
import { Language } from '../models/language.model';
import { LanguageFactory } from '../factory/language.factory';

@Injectable({ scope: Scope.REQUEST })
export class LanguageLoader {
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

  public readonly languagesByCvIdLoader = new DataLoader<string, Language[]>(
    async (cvIds: readonly string[]) => {
      const languages = await this.prisma.language.findMany({
        where: { cvId: { in: [...cvIds] } },
      });

      const languageMap = new Map<string, Language[]>();
      languages.forEach((lang) => {
        const list = languageMap.get(lang.cvId) || [];
        list.push(LanguageFactory.fromPrisma(lang as any));
        languageMap.set(lang.cvId, list);
      });

      return cvIds.map((id) => languageMap.get(id) || []);
    },
  );
}
