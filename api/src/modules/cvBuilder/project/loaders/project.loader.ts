import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../../cv/models/cv.model';
import { Project } from '../models/project.model';
import { ProjectFactory } from '../factory/project.factory';

@Injectable({ scope: Scope.REQUEST })
export class ProjectLoader {
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

  public readonly projectsByCvIdLoader = new DataLoader<string, Project[]>(
    async (cvIds: readonly string[]) => {
      const projects = await this.prisma.project.findMany({
        where: { cvId: { in: [...cvIds] } },
        orderBy: { startDate: 'desc' },
      });

      const projectMap = new Map<string, Project[]>();
      projects.forEach((proj) => {
        const list = projectMap.get(proj.cvId) || [];
        list.push(ProjectFactory.fromPrisma(proj as any));
        projectMap.set(proj.cvId, list);
      });

      return cvIds.map((id) => projectMap.get(id) || []);
    },
  );
}
