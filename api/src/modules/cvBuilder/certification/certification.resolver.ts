import {
  Resolver,
  Query,
  Mutation,
  Args,
  ResolveField,
  Parent,
} from '@nestjs/graphql';
import { CertificationService } from './certification.service';
import { Certification } from './models/certification.model';
import {
  CertificationResponse,
  CertificationsResponse,
} from './dtos/certificationResponse.dto';
import { CreateCertificationInput } from './inputs/createCertification.input';
import { UpdateCertificationInput } from './inputs/updateCertification.input';
import { PaginationInput } from 'src/common/inputs/pagination.input';
import { Auth } from 'src/common/decorator/auth.decorator';
import { CurrentUser } from 'src/common/decorator/currentUser.decorator';
import { CurrentUserDto } from '@bts-soft/core';
import { Permission } from 'src/common/constant/enum.constant';
import { CertificationLoader } from './loaders/certification.loader';
import { User } from 'src/modules/users/entity/user.entity';
import { Cv } from '../cv/models/cv.model';

@Resolver(() => Certification)
export class CertificationResolver {
  constructor(
    private readonly certificationService: CertificationService,
    private readonly certificationLoader: CertificationLoader,
  ) {}

  @Mutation(() => CertificationResponse)
  @Auth([Permission.CREATE_CERTIFICATION])
  async createCertification(
    @CurrentUser() user: CurrentUserDto,
    @Args('data') data: CreateCertificationInput,
  ): Promise<CertificationResponse> {
    return this.certificationService.createCertification(user.id, data);
  }

  @Query(() => CertificationsResponse)
  @Auth([Permission.GET_CERTIFICATION])
  async getCertificationsByUserId(
    @CurrentUser() user: CurrentUserDto,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<CertificationsResponse> {
    return this.certificationService.getCertificationsByUserId(
      user.id,
      pagination,
    );
  }

  @Query(() => CertificationsResponse)
  @Auth([Permission.GET_CERTIFICATION])
  async getCertificationsByCvId(
    @CurrentUser() user: CurrentUserDto,
    @Args('cvId') cvId: string,
    @Args('pagination', { type: () => PaginationInput, nullable: true })
    pagination?: PaginationInput,
  ): Promise<CertificationsResponse> {
    return this.certificationService.getCertificationsByCvId(
      user.id,
      cvId,
      pagination,
    );
  }

  @Query(() => CertificationResponse)
  @Auth([Permission.GET_CERTIFICATION])
  async getCertificationById(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<CertificationResponse> {
    return this.certificationService.getCertificationById(user.id, id);
  }

  @Mutation(() => CertificationResponse)
  @Auth([Permission.UPDATE_CERTIFICATION])
  async updateCertification(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
    @Args('data') data: UpdateCertificationInput,
  ): Promise<CertificationResponse> {
    return this.certificationService.updateCertification(user.id, id, data);
  }

  @Mutation(() => CertificationResponse, { nullable: true })
  @Auth([Permission.DELETE_CERTIFICATION])
  async deleteCertification(
    @CurrentUser() user: CurrentUserDto,
    @Args('id') id: string,
  ): Promise<CertificationResponse | null> {
    return this.certificationService.deleteCertification(user.id, id);
  }

  @ResolveField(() => User, { name: 'user', nullable: true })
  async getUser(@Parent() cert: Certification): Promise<User | null> {
    return this.certificationLoader.userLoader.load(cert.userId);
  }

  @ResolveField(() => Cv, { name: 'cv', nullable: true })
  async getCv(@Parent() cert: Certification): Promise<Cv | null> {
    return this.certificationLoader.cvLoader.load(cert.cvId);
  }
}
