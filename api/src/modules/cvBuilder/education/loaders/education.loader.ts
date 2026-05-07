import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../../cv/models/cv.model';
import { Education } from '../models/education.model';
import { EducationFactory } from '../factory/education.factory';

@Injectable({ scope: Scope.REQUEST })
export class EducationLoader {
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

  public readonly educationsByCvIdLoader = new DataLoader<string, Education[]>(
    async (cvIds: readonly string[]) => {
      const educations = await this.prisma.education.findMany({
        where: { cvId: { in: [...cvIds] } },
        orderBy: { startDate: 'desc' },
      });

      const educationMap = new Map<string, Education[]>();
      educations.forEach((edu) => {
        const list = educationMap.get(edu.cvId) || [];
        list.push(EducationFactory.fromPrisma(edu as any));
        educationMap.set(edu.cvId, list);
      });

      return cvIds.map((id) => educationMap.get(id) || []);
    },
  );
}
