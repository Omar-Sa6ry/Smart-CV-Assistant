import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserResolver } from './users.resolver';
import { UserFacadeService } from './fascade/user.fascade';
import { RedisModule } from '@bts-soft/core';

@Module({
  imports: [RedisModule],
  providers: [
    UserService,
    UserResolver,
    UserFacadeService,
  ],
  exports: [UserService],
})
export class UserModule {}
