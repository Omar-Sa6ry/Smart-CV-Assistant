import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { RedisService } from '@bts-soft/core';
import { Role } from 'src/common/constant/enum.constant';

describe('AuthResolver (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let redisService: RedisService;
  let userToken: string;
  let userId: string;

  const testUser = {
    firstName: 'Omar',
    lastName: 'Sabry',
    email: `omar@example.com`,
    password: 'Password123!',
  };

  const adminGuardian = {
    firstName: 'Admin',
    lastName: 'Guardian',
    email: `admin@example.com`,
    password: 'Password123!',
  };

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);
    redisService = app.get(RedisService, { strict: false });

    // Clean up test users
    await prisma.user.deleteMany({
      where: { email: { contains: 'example.com' } },
    });

    // Create a first user to take the ADMIN role
    const registerMutation = `
      mutation Register($input: CreateUserDto!) {
        register(createUserDto: $input) {
          message
        }
      }
    `;
    await testUtils.graphqlRequest(registerMutation, { input: adminGuardian });
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { contains: 'example.com' } },
      });
    }
    await TestUtils.teardownApp(app);
  });

  describe('Registration', () => {
    it('should register a new user successfully and return JWT', async () => {
      const registerMutation = `
        mutation Register($input: CreateUserDto!) {
          register(createUserDto: $input) {
            message
            data {
              token
              user {
                id
                email
                firstName
                lastName
              }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(registerMutation, {
        input: testUser,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body.data.register;
      expect(data.user.email).toBe(testUser.email.toLowerCase());
      expect(data.token).toBeDefined();

      // Side Effect: Persistence Verify
      const userInDb = await prisma.user.findUnique({
        where: { email: testUser.email.toLowerCase() },
      });
      expect(userInDb).toBeDefined();
      expect(userInDb!.role).toBe(Role.USER);

      userId = data.user.id;
      userToken = data.token;
    });

    it('should block registration with an already existing email', async () => {
      const registerMutation = `
        mutation Register($input: CreateUserDto!) {
          register(createUserDto: $input) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(registerMutation, {
        input: testUser,
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Login', () => {
    it('should login an existing user with correct credentials', async () => {
      const loginMutation = `
        mutation Login($input: LoginDto!) {
          login(loginDto: $input) {
            message
            data {
              token
              user {
                id
                email
              }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(loginMutation, {
        input: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body.data.login;
      expect(data.user.email).toBe(testUser.email.toLowerCase());
      expect(data.token).toBeDefined();
    });

    it('should block loginAsAdmin for a standard USER role', async () => {
      const loginAdminMutation = `
        mutation LoginAsAdmin($input: LoginDto!) {
          loginAsAdmin(loginDto: $input) {
            message
            data {
               token
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(loginAdminMutation, {
        input: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Access denied');
    });
  });

  describe('Password Management', () => {
    it('should execute forgotPassword successfully', async () => {
      const forgotPasswordMutation = `
        mutation ForgotPassword {
          forgotPassword {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(forgotPasswordMutation, {}, userToken);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
    });

    it('should change password successfully', async () => {
      const changePasswordMutation = `
        mutation ChangePassword($input: ChangePasswordDto!) {
          changePassword(changePasswordDto: $input) {
            message
            data {
              id
              email
            }
          }
        }
      `;

      const newPassword = 'NewCoolPassword123!';
      const response = await testUtils.graphqlRequest(changePasswordMutation, {
        input: {
          password: testUser.password,
          newPassword: newPassword,
        },
      }, userToken);

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      testUser.password = newPassword;
    });

    it('should login with the newly created password', async () => {
      const loginMutation = `
        mutation Login($input: LoginDto!) {
          login(loginDto: $input) {
            data {
              token
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(loginMutation, {
        input: {
          email: testUser.email,
          password: testUser.password,
        },
      });

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.login.data.token).toBeDefined();
    });
  });
});
