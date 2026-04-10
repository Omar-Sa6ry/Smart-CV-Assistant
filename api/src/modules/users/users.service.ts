import { Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { UserResponse, UsersResponse } from './dto/UserResponse.dto';
import { UserProxy } from './proxy/user.proxy';
import { IUserObserver } from './interfaces/IUserObserver.interface';
import { CacheObserver } from './observer/user.observer';
import { Limit, Page } from 'src/common/constant/messages.constant';
import { RedisService } from '@bts-soft/core';
import { PrismaService } from 'src/common/database/prisma.service';

@Injectable()
export class UserService {
  private proxy: UserProxy;
  private observers: IUserObserver[] = [];

  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
    this.proxy = new UserProxy(this.i18n, this.redisService, this.prisma);
    this.observers.push(new CacheObserver(this.redisService));
  }

  async findById(id: string): Promise<UserResponse> {
    return this.proxy.findById(id);
  }

  async findByEmail(email: string): Promise<UserResponse> {
    return this.proxy.findByEmail(email);
  }

  async findUsers(
    page: number = Page,
    limit: number = Limit,
  ): Promise<UsersResponse> {
    return this.proxy.findUsers(page, limit);
  }
}
