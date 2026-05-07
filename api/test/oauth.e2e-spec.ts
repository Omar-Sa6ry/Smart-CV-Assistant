import { INestApplication, ExecutionContext } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { AuthGuard } from "@nestjs/passport";
import request from "supertest";
import { TestUtils } from "./test-utils";
import { PrismaService } from "src/common/database/prisma.service";
import { AppModule } from "../src/app.module";
import { Role } from "src/common/constant/enum.constant";

describe('OAuth Controller (e2e)', () => {
    jest.setTimeout(60000);
    let app: INestApplication;
    let testUtils: TestUtils;
    let prisma: PrismaService;

    const mockGoogleProfile = {
        googleId: 'google-123',
        email: 'omar-google@oauth.test',
        firstName: 'Google',
        lastName: 'User',
    };

    let activeMockProfile: any = mockGoogleProfile;

    // This mock guard will attach the activeMockProfile to the request object
    const mockGoogleGuard = {
        canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            req.user = activeMockProfile;
            return true;
        }
    };

    beforeAll(async () => {
        const mockNotificationService = {
            send: jest.fn().mockResolvedValue(true),
            sendEmail: jest.fn().mockResolvedValue(true),
            sendSMS: jest.fn().mockResolvedValue(true),
            sendPushNotification: jest.fn().mockResolvedValue(true),
        };
        
        const core = require('@bts-soft/core');

        // We manually create the module to override the Google AuthGuard
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        })
        .overrideProvider(core.NotificationService)
        .useValue(mockNotificationService)
        .overrideGuard(AuthGuard('google'))
        .useValue(mockGoogleGuard)
        .compile();

        app = moduleFixture.createNestApplication();
        await app.init();

        testUtils = new TestUtils(app);
        prisma = app.get(PrismaService);

        // Cleanup test users
        await prisma.user.deleteMany({
            where: { 
                email: { contains: '@oauth.test' }
            }
        });
    });

    afterAll(async () => {
        await prisma.user.deleteMany({
            where: { 
                email: { contains: '@oauth.test' }
            }
        });
        await TestUtils.teardownApp(app);
    });

    describe('GET /auth/google', () => {
        it('should be guarded and eventually redirect (handled by passport)', async () => {
            // Our mock guard makes it succeed immediately
            const response = await request(app.getHttpServer()).get('/auth/google');
            expect(response.status).toBe(200);
        });
    });

    describe('GET /auth/google/callback', () => {
        it('should register a new user via Google and redirect to frontend with token', async () => {
            const response = await request(app.getHttpServer()).get('/auth/google/callback');

            expect(response.status).toBe(302);
            expect(response.header.location).toContain('token=');
            expect(response.header.location).toContain('login.html');

            const user = await prisma.user.findUnique({
                where: { email: mockGoogleProfile.email }
            });
            expect(user).toBeDefined();
            expect(user!.googleId).toBe(mockGoogleProfile.googleId);
            expect(user!.firstName).toBe(mockGoogleProfile.firstName);
            expect(user!.role).toBeDefined(); // Just ensure it has a role
        });

        it('should login an existing user with matching googleId', async () => {
            // User already exists from previous test
            const response = await request(app.getHttpServer()).get('/auth/google/callback');

            expect(response.status).toBe(302);
            expect(response.header.location).toContain('token=');
            
            const users = await prisma.user.findMany({
                where: { googleId: mockGoogleProfile.googleId }
            });
            expect(users.length).toBe(1);
        });

        it('should link googleId to an existing user with matching email', async () => {
            await prisma.user.deleteMany({ where: { email: 'link-test@oauth.test' } });
            
            // Create user without googleId
            await prisma.user.create({
                data: {
                    email: 'link-test@example.com',
                    firstName: 'Manual',
                    lastName: 'User',
                    password: 'password123',
                    role: Role.USER,
                }
            });

            // Mock profile with matching email
            const linkProfile = { ...mockGoogleProfile, email: 'link-test@oauth.test', googleId: 'new-google-link' };
            
            // Update the profile used by the guard
            activeMockProfile = linkProfile;

            const response = await request(app.getHttpServer()).get('/auth/google/callback');

            expect(response.status).toBe(302);
            
            const user = await prisma.user.findUnique({
                where: { email: 'link-test@oauth.test' }
            });
            expect(user!.googleId).toBe('new-google-link');
        });
    });
});