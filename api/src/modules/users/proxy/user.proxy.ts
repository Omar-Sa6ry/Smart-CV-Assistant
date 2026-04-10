import { UserResponse, UsersResponse } from '../dto/UserResponse.dto';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from 'src/common/database/prisma.service';
import { User as PrismaUser } from '@prisma/client';
import { BadRequestException, NotFoundException, Injectable } from '@nestjs/common';
import { Limit, Page } from 'src/common/constant/messages.constant';
import { RedisService } from '@bts-soft/core';
import { UserFactory } from '../factory/user.factory';
import { User as UserEntity } from '../entity/user.entity';

@Injectable()
export class UserProxy {
  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {}

  async findById(id: string): Promise<UserResponse> {
    const cacheKey = `user:${id}`;
    const cachedUser = await this.redisService.get<UserEntity>(cacheKey);
    if (cachedUser) return { data: cachedUser };

    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'));

    const mappedUser = UserFactory.fromPrisma(user);
    this.redisService.set(cacheKey, mappedUser);
    this.redisService.set(`user:email:${user.email}`, mappedUser);

    return { data: mappedUser };
  }

  async findByEmail(email: string): Promise<UserResponse> {
    const cacheKey = `user:email:${email}`;
    const cachedUser = await this.redisService.get<UserEntity>(cacheKey);

    if (cachedUser) return { data: cachedUser };

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new NotFoundException(await this.i18n.t('user.NOT_FOUND'));

    const mappedUser = UserFactory.fromPrisma(user);
    this.redisService.set(cacheKey, mappedUser);
    this.redisService.set(`user:id:${user.id}`, mappedUser);

    return { data: mappedUser };
  }

  async findUsers(
    page: number = Page,
    limit: number = Limit,
  ): Promise<UsersResponse> {
    const [items, total] = await Promise.all([
      this.prisma.user.findMany({
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.user.count(),
    ]);

    if (items.length === 0)
      throw new NotFoundException(await this.i18n.t('user.NOT_FOUNDS'));

    return {
      items: UserFactory.fromPrismaArray(items),
      pagination: {
        totalItems: total,
        currentPage: page,
        totalPages: Math.ceil(total / limit),
      },
    };
  }



  async dataExisted(
    email: string,
  ): Promise<void> {
    const cacheKey = `user:email:${email}`;
    const cachedUser = await this.redisService.get(cacheKey);

    if (cachedUser)
      throw new BadRequestException(await this.i18n.t('user.EMAIL_EXISTED'));

    const emailExisted = await this.prisma.user.findUnique({ where: { email } });
    if (emailExisted)
      throw new BadRequestException(await this.i18n.t('user.EMAIL_EXISTED'));
  }


}
