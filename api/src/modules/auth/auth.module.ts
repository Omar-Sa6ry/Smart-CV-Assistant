import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModule } from '../users/users.module';
import { JwtModule } from './jwt/jwt.module';
import { GenerateTokenFactory } from './jwt/jwt.service';
import { AuthServiceFacade } from './fascade/AuthService.facade';
import { PasswordServiceAdapter } from './adapter/password.adapter';
import { UserProxy } from '../users/proxy/user.proxy';
import { NotificationModule, RedisModule } from '@bts-soft/core';

@Module({
  imports: [UserModule, RedisModule, JwtModule, NotificationModule],
  providers: [
    AuthResolver,
    AuthService,
    UserProxy,
    AuthServiceFacade,
    PasswordServiceAdapter,
    GenerateTokenFactory,
  ],
})
export class AuthModule {}
