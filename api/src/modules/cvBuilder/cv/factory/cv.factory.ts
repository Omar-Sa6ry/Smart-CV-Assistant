import { Injectable } from '@nestjs/common';
import { Cv } from '../models/cv.model';
import { Cv as PrismaCv, User as PrismaUser } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { ExperienceFactory } from '../../experience/factory/experience.factory';
import { EducationFactory } from '../../education/factory/education.factory';
import { ProjectFactory } from '../../project/factory/project.factory';
import { LanguageFactory } from '../../language/factory/language.factory';
import { SkillFactory } from '../../skill/factory/skill.factory';

type PrismaCvWithRelations = PrismaCv & { 
  user?: PrismaUser | null;
  experiences?: any[];
  educations?: any[];
  projects?: any[];
  languages?: any[];
  skills?: any[];
};

@Injectable()
export class CvFactory {
  static fromPrisma(cv: PrismaCvWithRelations): Cv {
    const { experiences, educations, projects, languages, skills, ...rest } = cv;
    const data: any = { ...rest };
    
    if (experiences) {
      data.experiences = ExperienceFactory.fromPrismaArray(experiences);
    }

    if (educations) {
      data.educations = EducationFactory.fromPrismaArray(educations);
    }

    if (projects) {
      data.projects = ProjectFactory.fromPrismaArray(projects);
    }

    if (languages) {
      data.languages = LanguageFactory.fromPrismaArray(languages);
    }

    if (skills) {
      data.skills = SkillFactory.fromPrismaArray(skills);
    }

    return plainToInstance(Cv, data, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(cvs: PrismaCvWithRelations[]): Cv[] {
    return cvs.map(cv => this.fromPrisma(cv));
  }
}
