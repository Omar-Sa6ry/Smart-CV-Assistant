import {
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { CreateSkillInput } from './inputs/createSkill.input';
import { UpdateSkillInput } from './inputs/updateSkill.input';
import { SearchSkillKeywordInput } from './inputs/searchSkillKeyword.input';
import { I18nService } from 'nestjs-i18n';
import { SkillBuilderFactory } from './builder/skill-builder.factory';
import { SkillFactory } from './factory/skill.factory';
import { SkillResponse, SkillsResponse } from './dtos/skillResponse.dto';
import { SkillKeywordsResponse } from './dtos/skill-keywordResponse.dto';
import { CvService } from '../cv/cv.service';
import { PaginationInput } from 'src/common/inputs/pagination.input';

@Injectable()
export class SkillService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    @Inject(forwardRef(() => CvService))
    private readonly cvService: CvService,
    private readonly builderFactory: SkillBuilderFactory,
  ) {}

  async createSkill(
    userId: string,
    data: CreateSkillInput,
  ): Promise<SkillResponse> {
    await this.cvService.getById(data.cvId, userId);
    await this.checkIfExisted(data.name, data.cvId);

    let keyword = await this.prisma.skillKeyword.findFirst({
      where: { name: { equals: data.name, mode: 'insensitive' } },
    });

    if (keyword) {
      await this.prisma.skillKeyword.update({
        where: { id: keyword.id },
        data: { popularityScore: { increment: 1 } },
      });
    } else {
      keyword = await this.prisma.skillKeyword.create({
        data: {
          name: data.name,
          isVerified: false,
          popularityScore: 1,
        },
      });
    }

    const builder = this.builderFactory.create();
    const skillData = builder
      .setName(data.name)
      .setProficiency(data.proficiency)
      .setUser(userId)
      .setCv(data.cvId)
      .setKeyword(keyword.id)
      .build();

    const skill = await this.prisma.skill.create({
      data: skillData as any,
      include: { keyword: true },
    });

    const cvData = await this.cvService.getById(data.cvId, userId, true);
    await this.cvService.invalidateCache(data.cvId, cvData.data);

    return {
      data: SkillFactory.fromPrisma(skill),
      statusCode: 201,
      message: await this.i18n.t('skill.CREATED'),
    };
  }

  async getSkillsByUserId(userId: string): Promise<SkillsResponse> {
    const skills = await this.prisma.skill.findMany({
      where: { userId },
    });

    return {
      items: SkillFactory.fromPrismaArray(skills),
      success: true,
      statusCode: 200,
    };
  }

  async getSkillsByCvId(userId: string, cvId: string): Promise<SkillsResponse> {
    const skills = await this.prisma.skill.findMany({
      where: { cvId, userId },
    });

    return {
      items: SkillFactory.fromPrismaArray(skills),
      success: true,
      statusCode: 200,
    };
  }

  async getSkillById(userId: string, id: string): Promise<SkillResponse> {
    const skill = await this.prisma.skill.findUnique({
      where: { id },
      include: { cv: true, user: true, keyword: true },
    });

    if (!skill || skill.userId !== userId)
      throw new NotFoundException(await this.i18n.t('skill.NOT_FOUND'));

    return { data: SkillFactory.fromPrisma(skill) };
  }

  async updateSkill(
    userId: string,
    id: string,
    data: UpdateSkillInput,
  ): Promise<SkillResponse> {
    await this.getSkillById(userId, id);

    const updated = await this.prisma.skill.update({
      where: { id },
      data: {
        name: data.name,
        proficiency: data.proficiency,
      },
      include: { cv: true, user: true, keyword: true },
    });

    const cvData = await this.cvService.getById(updated.cvId, userId, true);
    await this.cvService.invalidateCache(updated.cvId, cvData.data);

    return {
      data: SkillFactory.fromPrisma(updated),
      message: await this.i18n.t('skill.UPDATED'),
    };
  }

  async deleteSkill(userId: string, id: string): Promise<SkillResponse> {
    const skillRes = await this.getSkillById(userId, id);
    await this.prisma.skill.delete({ where: { id } });

    const cvId = (skillRes.data as any).cvId;
    const cvData = await this.cvService.getById(cvId, userId, true);
    await this.cvService.invalidateCache(cvId, cvData.data);

    return {
      data: null,
      message: await this.i18n.t('skill.DELETED'),
    };
  }

  async searchKeywords(
    input: SearchSkillKeywordInput,
    pagination?: PaginationInput,
  ): Promise<SkillKeywordsResponse> {
    const page = pagination?.page || 1;
    const limit = pagination?.limit || 10;

    const keywords = await this.prisma.skillKeyword.findMany({
      where: {
        name: {
          contains: input.query,
          mode: 'insensitive',
        },
      },
      orderBy: { popularityScore: 'desc' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: SkillFactory.keywordFromPrismaArray(keywords),
      success: true,
      statusCode: 200,
    };
  }

  private async checkIfExisted(name: string, cvId: string) {
    const skill = await this.prisma.skill.findFirst({
      where: { cvId, name: { equals: name, mode: 'insensitive' } },
    });

    if (skill)
      throw new BadRequestException(await this.i18n.t('skill.EXISTED'));
  }
}
