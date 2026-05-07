import { Injectable } from '@nestjs/common';
import { Project } from '../models/project.model';
import { Project as PrismaProject, User as PrismaUser, Cv as PrismaCv } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

type PrismaProjectWithRelations = PrismaProject & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
};

@Injectable()
export class ProjectFactory {
  static fromPrisma(project: PrismaProjectWithRelations): Project {
    return plainToInstance(Project, project, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(projects: PrismaProjectWithRelations[]): Project[] {
    return projects.map(proj => this.fromPrisma(proj));
  }
}
