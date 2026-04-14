import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../models/cv.model';
import { Experience } from '../models/experience.model';

@Injectable({ scope: Scope.REQUEST })
export class ExperienceLoader {
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

  public readonly experiencesByCvIdLoader = new DataLoader<string, Experience[]>(
    async (cvIds: readonly string[]) => {
      const experiences = await this.prisma.experience.findMany({
        where: { cvId: { in: [...cvIds] } },
        orderBy: { startDate: 'desc' },
      });

      const experienceMap = new Map<string, Experience[]>();
      experiences.forEach((exp) => {
        const list = experienceMap.get(exp.cvId) || [];
        list.push(exp as any);
        experienceMap.set(exp.cvId, list);
      });

      return cvIds.map((id) => experienceMap.get(id) || []);
    },
  );
}
