import { Resolver, Query, Mutation, Args, ResolveField, Parent } from '@nestjs/graphql';
import { CvService } from './cv.service';
import { Cv } from './models/cv.model';
import { CvResponse, CvsResponse } from './dtos/cvResponse.dto';
import { CreateCvInput } from './inputs/createCv.Input';
import { UpdateCvInput } from './inputs/updateCv.Input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { ExperienceLoader } from '../experience/loaders/experience.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Experience } from '../experience/models/experience.model';
import { EducationLoader } from '../education/loaders/education.loader';
import { Education } from '../education/models/education.model';
import { CertificationLoader } from '../certification/loaders/certification.loader';
import { Certification } from '../certification/models/certification.model';
import { ProjectLoader } from '../project/loaders/project.loader';
import { Project } from '../project/models/project.model';
import { LanguageLoader } from '../language/loaders/language.loader';
import { Language } from '../language/models/language.model';
import { SkillLoader } from '../skill/loaders/skill.loader';
import { Skill } from '../skill/models/skill.model';

@Resolver(() => Cv)
export class CvResolver {
  constructor(
    private readonly cvService: CvService,
    private readonly experienceLoader: ExperienceLoader,
    private readonly educationLoader: EducationLoader,
    private readonly certificationLoader: CertificationLoader,
    private readonly projectLoader: ProjectLoader,
    private readonly languageLoader: LanguageLoader,
    private readonly skillLoader: SkillLoader,
  ) {}

  @Mutation(() => CvResponse)
  @Auth([Permission.CREATE_CV])
  async createCv(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateCvInput,
  ): Promise<CvResponse> {
    return this.cvService.createCv(user.id, data);
  }

  @Query(() => CvsResponse)
  @Auth([Permission.GET_USERS_CV])
  async getUserCvs(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<CvsResponse> {
    return this.cvService.getUserCvs(user.id, pagination);
  }

  @Query(() => CvResponse)
  @Auth([Permission.UPDATE_CV])
  async getCvById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<CvResponse> {
    return this.cvService.getById(id, user.id);
  }

  @Mutation(() => CvResponse)
  @Auth([Permission.UPDATE_CV])
  async updateCv(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateCvInput,
  ): Promise<CvResponse> {
    return this.cvService.updateCv(id, user.id, data);
  }

  @Mutation(() => CvResponse, { nullable: true })
  @Auth([Permission.DELETE_CV])
  async deleteCv(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<CvResponse | null> {
    return this.cvService.deleteCv(id, user.id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() cv: Cv): Promise<User | null> {
    return this.experienceLoader.userLoader.load(cv.userId);
  }

  @ResolveField(() => [Experience], { name: 'experiences', nullable: true })
  async getExperiences(@Parent() cv: Cv): Promise<Experience[]> {
    return this.experienceLoader.experiencesByCvIdLoader.load(cv.id);
  }

  @ResolveField(() => [Education], { name: 'educations', nullable: true })
  async getEducations(@Parent() cv: Cv): Promise<Education[]> {
    return this.educationLoader.educationsByCvIdLoader.load(cv.id);
  }

  @ResolveField(() => [Certification], { name: 'certifications', nullable: true })
  async getCertifications(@Parent() cv: Cv): Promise<Certification[]> {
    return this.certificationLoader.certsByCvIdLoader.load(cv.id);
  }

  @ResolveField(() => [Project], { name: 'projects', nullable: true })
  async getProjects(@Parent() cv: Cv): Promise<Project[]> {
    return this.projectLoader.projectsByCvIdLoader.load(cv.id);
  }

  @ResolveField(() => [Language], { name: 'languages', nullable: true })
  async getLanguages(@Parent() cv: Cv): Promise<Language[]> {
    return this.languageLoader.languagesByCvIdLoader.load(cv.id);
  }

  @ResolveField(() => [Skill], { name: 'skills', nullable: true })
  async getSkills(@Parent() cv: Cv): Promise<Skill[]> {
    return this.skillLoader.skillsByCvIdLoader.load(cv.id);
  }
}
