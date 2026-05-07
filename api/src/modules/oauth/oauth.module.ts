import { Module } from '@nestjs/common';
import { GoogleStrategy } from './strategies/google.strategy';
import { OAuthService } from './oauth.service';
import { GenerateTokenFactory } from 'src/modules/auth/jwt/jwt.service';
import { OAuthController } from './oauth.controller';
import { PassportModule } from '@nestjs/passport';

@Module({
  imports: [PassportModule.register({ session: false })],
  controllers: [OAuthController],
  providers: [GoogleStrategy, OAuthService, GenerateTokenFactory],
})
export class OAuthModule {}
