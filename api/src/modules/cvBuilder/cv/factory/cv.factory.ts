import { Injectable } from '@nestjs/common';
import { Cv } from '../models/cv.model';
import { Cv as PrismaCv, User as PrismaUser } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

type PrismaCvWithUser = PrismaCv & { user?: PrismaUser | null };

@Injectable()
export class CvFactory {
  static fromPrisma(cv: PrismaCvWithUser): Cv {
    return plainToInstance(Cv, cv, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(cvs: PrismaCvWithUser[]): Cv[] {
    return plainToInstance(Cv, cvs, {
      excludeExtraneousValues: false,
    });
  }
}
