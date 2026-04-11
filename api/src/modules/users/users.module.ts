import { Module } from '@nestjs/common';
import { UserService } from './users.service';
import { UserResolver } from './users.resolver';
import { UserFacadeService } from './fascade/user.fascade';
import { RedisModule } from '@bts-soft/core';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [RedisModule, JwtModule.register({})],
  providers: [
    UserService,
    UserResolver,
    UserFacadeService,
  ],
  exports: [UserService],
})
export class UserModule {}
