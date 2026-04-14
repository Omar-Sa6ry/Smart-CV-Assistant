import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateCertificationInput } from './inputs/createCertification.input';
import { UpdateCertificationInput } from './inputs/updateCertification.input';
import { I18nService } from 'nestjs-i18n';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { CertificationBuilderFactory } from './builder/certification-builder.factory';
import { CertificationFactory } from './factory/certification.factory';
import {
  CertificationResponse,
  CertificationsResponse,
} from './dtos/certificationResponse.dto';
import { CvService } from '../cv/cv.service';

@Injectable()
export class CertificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => CvService))
    private readonly cvService: CvService,
    private readonly builderFactory: CertificationBuilderFactory,
  ) {}

  async createCertification(
    userId: string,
    data: CreateCertificationInput,
  ): Promise<CertificationResponse> {
    await this.cvService.getById(data.cvId, userId);

    const builder = this.builderFactory.create();

    // Ensure issueDate is a valid Date object
    const issueDate = new Date(data.issueDate);
    if (isNaN(issueDate.getTime())) {
      throw new BadRequestException('Invalid issue date format');
    }

    const certData = builder
      .setName(data.name)
      .setIssuingOrganization(data.issuingOrganization)
      .setCredentialId(data.credentialId)
      .setCredentialUrl(data.credentialUrl)
      .setIssueDate(issueDate)
      .setUser(userId)
      .setCv(data.cvId)
      .build();

    const cert = await this.prisma.certification.create({
      data: certData as any,
      include: { cv: true, user: true },
    });

    return {
      data: CertificationFactory.fromPrisma(cert),
      statusCode: 201,
      message: await this.i18n.t('certification.CREATED'),
    };
  }

  async getCertificationsByCvId(
    userId: string,
    cvId: string,
    pagination?: PaginationInput,
  ): Promise<CertificationsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [certs, total] = await this.prisma.$transaction([
      this.prisma.certification.findMany({
        where: { cvId, userId },
        include: { cv: true, user: true },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.certification.count({ where: { cvId, userId } }),
    ]);

    return {
      items: CertificationFactory.fromPrismaArray(certs),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getCertificationsByUserId(
    userId: string,
    pagination?: PaginationInput,
  ): Promise<CertificationsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const [certs, total] = await this.prisma.$transaction([
      this.prisma.certification.findMany({
        where: { userId },
        include: { cv: true, user: true },
        orderBy: { issueDate: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.certification.count({ where: { userId } }),
    ]);

    return {
      items: CertificationFactory.fromPrismaArray(certs),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
      success: true,
      statusCode: 200,
    };
  }

  async getCertificationById(
    userId: string,
    id: string,
  ): Promise<CertificationResponse> {
    const cert = await this.prisma.certification.findUnique({
      where: { id },
      include: { cv: true, user: true },
    });

    if (!cert || cert.userId !== userId) {
      throw new NotFoundException(await this.i18n.t('certification.NOT_FOUND'));
    }

    return { data: CertificationFactory.fromPrisma(cert) };
  }

  async updateCertification(
    userId: string,
    id: string,
    data: UpdateCertificationInput,
  ): Promise<CertificationResponse> {
    await this.getCertificationById(userId, id);

    const updated = await this.prisma.certification.update({
      where: { id },
      data: {
        name: data.name,
        issuingOrganization: data.issuingOrganization,
        credentialId: data.credentialId,
        credentialUrl: data.credentialUrl,
        issueDate: data.issueDate,
      },
      include: { cv: true, user: true },
    });

    return {
      data: CertificationFactory.fromPrisma(updated),
      message: await this.i18n.t('certification.UPDATED'),
    };
  }

  async deleteCertification(
    userId: string,
    id: string,
  ): Promise<CertificationResponse> {
    await this.getCertificationById(userId, id);
    await this.prisma.certification.delete({ where: { id } });

    return {
      data: null,
      message: await this.i18n.t('certification.DELETED'),
    };
  }
}
