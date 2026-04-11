import { Module } from '@nestjs/common';
import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { UserModule } from '../users/users.module';
import { JwtModule } from './jwt/jwt.module';
import { GenerateTokenFactory } from './jwt/jwt.service';
import { AuthFacade } from './facade/auth.facade';
import { PasswordServiceAdapter } from './adapter/password.adapter';
import { NotificationModule, RedisModule } from '@bts-soft/core';

@Module({
  imports: [UserModule, RedisModule, JwtModule, NotificationModule],
  providers: [
    AuthResolver,
    AuthService,
    AuthFacade,
    PasswordServiceAdapter,
    GenerateTokenFactory,
  ],
  exports: [AuthService, AuthFacade],
})
export class AuthModule {}
