import { Controller, Get, Post, Req, Res, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OAuthService } from './oauth.service';
import { GenerateTokenFactory } from 'src/modules/auth/jwt/jwt.service';
import { Role } from 'src/common/constant/enum.constant';

@Controller('auth')
export class OAuthController {
  constructor(
    private readonly oauthService: OAuthService,
    private readonly tokenFactory: GenerateTokenFactory,
  ) {}

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth(@Req() req) {}

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleCallback(@Req() req: any, @Res() res: any) {
    try {
      const user = await this.oauthService.validateUser(req.user);

      const tokenService = await this.tokenFactory.createTokenGenerator();
      const token = await tokenService.generate(user.email, user.id);

    
      let frontendUrl = process.env.FRONTEND_URL || process.env.MAIN_CLIENT;
      
      if (!frontendUrl || frontendUrl.includes('localhost') || frontendUrl.includes('127.0.0.1')) {
          frontendUrl = 'https://cv-analysis.io';
      }

      console.log(`[GoogleAuth] Success. Redirecting to: ${frontendUrl}`);
      return res.redirect(`${frontendUrl}/pages/auth/login.html?token=${token}`);
    } catch (error) {
      console.error(`[GoogleAuth] Error: ${error.message}`);
      // Redirect with error
      let frontendUrl = process.env.FRONTEND_URL || process.env.MAIN_CLIENT || 'https://cv-analisis.io';
      if (frontendUrl.includes('localhost')) frontendUrl = 'https://cv-analisis.io';
      
      const redirectUrl = `${frontendUrl}/pages/auth/login.html?error=${encodeURIComponent(error.message || 'Authentication failed')}`;
      return res.redirect(redirectUrl);
    }
  }
}
