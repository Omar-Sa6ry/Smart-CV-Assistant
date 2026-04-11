import { Module } from '@nestjs/common';
import { JwtModule as jwtmodule, JwtService } from '@nestjs/jwt';

@Module({
  imports: [
    jwtmodule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'secret',
      signOptions: { 
        expiresIn: parseInt(process.env.JWT_EXPIRE || '3600') 
      },
    }),
  ],
  providers: [JwtService],
})
export class JwtModule {}