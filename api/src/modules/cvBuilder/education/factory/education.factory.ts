import { Injectable } from '@nestjs/common';
import { Education } from '../models/education.model';
import { Education as PrismaEducation, User as PrismaUser, Cv as PrismaCv } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

type PrismaEducationWithRelations = PrismaEducation & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
};

@Injectable()
export class EducationFactory {
  static fromPrisma(education: PrismaEducationWithRelations): Education {
    const data = {
      ...education,
      gpa: education.gpa ? Number(education.gpa) : null,
    };
    return plainToInstance(Education, data, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(educations: PrismaEducationWithRelations[]): Education[] {
    return educations.map(edu => this.fromPrisma(edu));
  }
}
