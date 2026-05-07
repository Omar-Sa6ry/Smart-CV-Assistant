import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserResolver } from './users.resolver';
import { UserFacade } from './facade/user.facade';
import { UserProxy } from './proxy/user.proxy';
import { CacheObserver } from './observer/user.observer';
import { UserFactory } from './factory/user.factory';
import { RedisModule } from '@bts-soft/core';
import { PasswordServiceAdapter } from '../auth/adapter/password.adapter';

@Module({
  imports: [RedisModule],
  providers: [
    UserService,
    UserResolver,
    UserFacade,
    UserProxy,
    CacheObserver,
    UserFactory,
    PasswordServiceAdapter,
  ],
  exports: [UserService, UserProxy],
})
export class UserModule {}
