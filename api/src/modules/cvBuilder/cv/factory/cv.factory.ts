import { Injectable } from '@nestjs/common';
import { Cv } from '../models/cv.model';
import { Cv as PrismaCv, User as PrismaUser } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { ExperienceFactory } from '../../experience/factory/experience.factory';
import { EducationFactory } from '../../education/factory/education.factory';

type PrismaCvWithRelations = PrismaCv & { 
  user?: PrismaUser | null;
  experiences?: any[];
  educations?: any[];
};

@Injectable()
export class CvFactory {
  static fromPrisma(cv: PrismaCvWithRelations): Cv {
    const { experiences, educations, ...rest } = cv;
    const data: any = { ...rest };
    
    if (experiences) {
      data.experiences = ExperienceFactory.fromPrismaArray(experiences);
    }

    if (educations) {
      data.educations = EducationFactory.fromPrismaArray(educations);
    }

    return plainToInstance(Cv, data, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(cvs: PrismaCvWithRelations[]): Cv[] {
    return cvs.map(cv => this.fromPrisma(cv));
  }
}
