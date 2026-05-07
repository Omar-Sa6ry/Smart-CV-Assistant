import { Injectable } from '@nestjs/common';
import { Certification } from '../models/certification.model';
import { Certification as PrismaCertification, User as PrismaUser, Cv as PrismaCv } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { CvFactory } from '../../cv/factory/cv.factory';
import { UserFactory } from 'src/modules/users/factory/user.factory';

type PrismaCertificationWithRelations = PrismaCertification & { 
  user?: PrismaUser | null;
  cv?: PrismaCv | null;
};

@Injectable()
export class CertificationFactory {
  static fromPrisma(cert: PrismaCertificationWithRelations): Certification {
    const { cv, user, ...rest } = cert;
    const data: any = { ...rest };
    
    if (cv) {
      data.cv = CvFactory.fromPrisma(cv as any);
    }

    if (user) {
      data.user = UserFactory.fromPrisma(user);
    }

    return plainToInstance(Certification, data, {
      excludeExtraneousValues: false,
    });
  }

  static fromPrismaArray(certs: PrismaCertificationWithRelations[]): Certification[] {
    return certs.map(cert => this.fromPrisma(cert));
  }
}
