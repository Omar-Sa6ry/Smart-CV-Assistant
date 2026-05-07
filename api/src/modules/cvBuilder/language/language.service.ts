import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateLanguageInput } from './inputs/createLanguage.input';
import { UpdateLanguageInput } from './inputs/updateLanguage.input';
import { I18nService } from 'nestjs-i18n';
import { LanguageBuilderFactory } from './builder/language-builder.factory';
import { LanguageFactory } from './factory/language.factory';
import {
  LanguageResponse,
  LanguagesResponse,
} from './dtos/languageResponse.dto';
import { CvService } from '../cv/cv.service';

@Injectable()
export class LanguageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => CvService))
    private readonly cvService: CvService,
    private readonly builderFactory: LanguageBuilderFactory,
  ) {}

  async createLanguage(
    userId: string,
    data: CreateLanguageInput,
  ): Promise<LanguageResponse> {
    await this.cvService.getById(data.cvId, userId);
    await this.checkIfExisted(data.name, data.cvId);

    const builder = this.builderFactory.create();
    const languageData = builder
      .setName(data.name)
      .setProficiency(data.proficiency)
      .setUser(userId)
      .setCv(data.cvId)
      .build();

    const language = await this.prisma.language.create({
      data: languageData as any,
    });

    const cvData = await this.cvService.getById(data.cvId, userId, true);
    await this.cvService.invalidateCache(data.cvId, cvData.data);

    return {
      data: LanguageFactory.fromPrisma(language),
      statusCode: 201,
      message: await this.i18n.t('language.CREATED'),
    };
  }

  async getLanguagesByUserId(userId: string): Promise<LanguagesResponse> {
    const languages = await this.prisma.language.findMany({
      where: { userId },
    });

    return {
      items: LanguageFactory.fromPrismaArray(languages),
      success: true,
      statusCode: 200,
    };
  }

  async getLanguagesByCvId(
    userId: string,
    cvId: string,
  ): Promise<LanguagesResponse> {
    const languages = await this.prisma.language.findMany({
      where: { cvId, userId },
    });

    return {
      items: LanguageFactory.fromPrismaArray(languages),
      success: true,
      statusCode: 200,
    };
  }

  async getLanguageById(userId: string, id: string): Promise<LanguageResponse> {
    const language = await this.prisma.language.findUnique({
      where: { id },
      include: { cv: true, user: true },
    });

    if (!language || language.userId !== userId) {
      throw new NotFoundException(await this.i18n.t('language.NOT_FOUND'));
    }

    return { data: LanguageFactory.fromPrisma(language) };
  }

  async updateLanguage(
    userId: string,
    id: string,
    data: UpdateLanguageInput,
  ): Promise<LanguageResponse> {
    await this.getLanguageById(userId, id);

    const updated = await this.prisma.language.update({
      where: { id },
      data: {
        name: data.name,
        proficiency: data.proficiency,
      },
      include: { cv: true, user: true },
    });

    const cvData = await this.cvService.getById(updated.cvId, userId, true);
    await this.cvService.invalidateCache(updated.cvId, cvData.data);

    return {
      data: LanguageFactory.fromPrisma(updated),
      message: await this.i18n.t('language.UPDATED'),
    };
  }

  async deleteLanguage(userId: string, id: string): Promise<LanguageResponse> {
    const languageRes = await this.getLanguageById(userId, id);
    await this.prisma.language.delete({ where: { id } });

    const cvId = (languageRes.data as any).cvId;
    const cvData = await this.cvService.getById(cvId, userId, true);
    await this.cvService.invalidateCache(cvId, cvData.data);

    return {
      data: null,
      message: await this.i18n.t('language.DELETED'),
    };
  }

  private async checkIfExisted(name: string, cvId: string) {
    const language = await this.prisma.language.findFirst({
      where: { cvId, name },
    });

    if (language)
      throw new BadRequestException(await this.i18n.t('language.EXISTED'));
  }
}
