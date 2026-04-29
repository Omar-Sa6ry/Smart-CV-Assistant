import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../../cv/models/cv.model';
import { Award } from '../models/award.model';
import { AwardFactory } from '../factory/award.factory';

@Injectable({ scope: Scope.REQUEST })
export class AwardLoader {
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

  public readonly awardsByCvIdLoader = new DataLoader<string, Award[]>(
    async (cvIds: readonly string[]) => {
      const awards = await this.prisma.award.findMany({
        where: { cvId: { in: [...cvIds] } },
        orderBy: { issueDate: 'desc' },
      });

      const awardMap = new Map<string, Award[]>();
      awards.forEach((award) => {
        const list = awardMap.get(award.cvId) || [];
        list.push(AwardFactory.fromPrisma(award as any));
        awardMap.set(award.cvId, list);
      });

      return cvIds.map((id) => awardMap.get(id) || []);
    },
  );
}
