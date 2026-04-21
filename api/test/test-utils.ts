import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../src/app.module';
import request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { Role } from 'src/common/constant/enum.constant';

export class TestUtils {
  private app: INestApplication;
  private jwtService: JwtService;

  constructor(app: INestApplication) {
    this.app = app;
    this.jwtService = app.get(JwtService);
  }

  static async createTestApp(): Promise<INestApplication> {
    const mockNotificationService = {
      send: jest.fn().mockResolvedValue(true),
      sendEmail: jest.fn().mockResolvedValue(true),
      sendSMS: jest.fn().mockResolvedValue(true),
      sendPushNotification: jest.fn().mockResolvedValue(true),
    };
    
    const core = require('@bts-soft/core');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(core.NotificationService)
      .useValue(mockNotificationService)
      .compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  static async teardownApp(app: INestApplication): Promise<void> {
    try {
      const redisClient = app.get('REDIS_CLIENT', { strict: false });
      if (redisClient && typeof redisClient.disconnect === 'function') {
        await redisClient.disconnect();
      }
    } catch (error) {
      // Ignore if injection token doesn't exist
    }
    
    await app.close();
  }

  async graphqlRequest(query: string, variables: any = {}, token?: string) {
    const req = request(this.app.getHttpServer())
      .post('/graphql')
      .send({
        query,
        variables,
      });

    if (token) {
      req.set('Authorization', `Bearer ${token}`);
    }

    return req;
  }

  async generateToken(user: { id: string; email: string; role: Role }) {
    return this.jwtService.signAsync(
      { id: user.id, email: user.email, role: user.role },
      { secret: process.env.JWT_SECRET || 'test-secret' }
    );
  }
}
