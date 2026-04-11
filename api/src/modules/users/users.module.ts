import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserResolver } from './users.resolver';
import { UserFacade } from './facade/user.facade';
import { UserProxy } from './proxy/user.proxy';
import { CacheObserver } from './observer/user.observer';
import { UserFactory } from './factory/user.factory';
import { RedisModule } from '@bts-soft/core';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [RedisModule, JwtModule.register({})],
  providers: [
    UserService,
    UserResolver,
    UserFacade,
    UserProxy,
    CacheObserver,
    UserFactory,
  ],
  exports: [UserService, UserFacade],
})
export class UserModule {}
