import { Injectable } from '@nestjs/common';
import { Experience } from '../models/experience.model';
import { Experience as PrismaExperience, User as PrismaUser, Cv as PrismaCv } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

type PrismaExperienceWithRelations = PrismaExperience & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
};

@Injectable()
export class ExperienceFactory {
  static fromPrisma(experience: PrismaExperienceWithRelations): Experience {
    return plainToInstance(Experience, experience, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(experiences: PrismaExperienceWithRelations[]): Experience[] {
    return plainToInstance(Experience, experiences, {
      excludeExtraneousValues: false,
    });
  }
}
