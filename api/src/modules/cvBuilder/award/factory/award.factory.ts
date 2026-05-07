import { Injectable } from '@nestjs/common';
import { Award } from '../models/award.model';
import { Award as PrismaAward, User as PrismaUser, Cv as PrismaCv } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CvFactory } from '../../cv/factory/cv.factory';
import { UserFactory } from 'src/modules/users/factory/user.factory';

type PrismaAwardWithRelations = PrismaAward & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
};

@Injectable()
export class AwardFactory {
  static fromPrisma(award: PrismaAwardWithRelations): Award {
    const { cv, user, ...rest } = award;
    const data: any = { ...rest };
    
    if (cv) {
      data.cv = CvFactory.fromPrisma(cv as any);
    }

    if (user) {
      data.user = UserFactory.fromPrisma(user);
    }

    return plainToInstance(Award, data, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(awards: PrismaAwardWithRelations[]): Award[] {
    return awards.map(award => this.fromPrisma(award));
  }
}
