import DataLoader from 'dataloader';
import { Injectable, Scope } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../../cv/models/cv.model';
import { Certification } from '../models/certification.model';
import { CertificationFactory } from '../factory/certification.factory';

@Injectable({ scope: Scope.REQUEST })
export class CertificationLoader {
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

  public readonly certsByCvIdLoader = new DataLoader<string, Certification[]>(
    async (cvIds: readonly string[]) => {
      const certs = await this.prisma.certification.findMany({
        where: { cvId: { in: [...cvIds] } },
        orderBy: { issueDate: 'desc' },
      });

      const certMap = new Map<string, Certification[]>();
      certs.forEach((cert) => {
        const list = certMap.get(cert.cvId) || [];
        list.push(CertificationFactory.fromPrisma(cert as any));
        certMap.set(cert.cvId, list);
      });

      return cvIds.map((id) => certMap.get(id) || []);
    },
  );
}
