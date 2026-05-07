import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';

describe('UserResolver (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;
  let standardUserId: string;
  let targetUserId: string;
  let redisService: any;

  const adminUser = {
    firstName: 'Admin',
    lastName: 'User',
    email: 'admin-users-e2e@users.test',
    password: 'Password123!',
  };

  const standardUser = {
    firstName: 'Standard',
    lastName: 'User',
    email: 'standard-users-e2e@users.test',
    password: 'Password123!',
  };

  const targetUser = {
    firstName: 'Target',
    lastName: 'User',
    email: 'target-users-e2e@users.test',
    password: 'Password123!',
  };

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);
    const core = require('@bts-soft/core');
    redisService = app.get(core.RedisService);

    await prisma.user.deleteMany({
      where: { email: { contains: '@users.test' } },
    });

    try {
      if (redisService && typeof redisService.flushAll === 'function') {
        await redisService.flushAll();
      }
    } catch (e) {
      // Ignore if redis is not available
    }

    const registerMutation = `
      mutation Register($input: CreateUserDto!) {
        register(createUserDto: $input) {
          data {
            token
            user { id }
          }
        }
      }
    `;

    const adminRes = await testUtils.graphqlRequest(registerMutation, {
      input: adminUser,
    });
    const adminId = adminRes.body.data.register.data.user.id;
    adminToken = adminRes.body.data.register.data.token;

    await prisma.user.update({
      where: { id: adminId },
      data: { role: Role.ADMIN },
    });

    const userRes = await testUtils.graphqlRequest(registerMutation, {
      input: standardUser,
    });
    userToken = userRes.body.data.register.data.token;
    standardUserId = userRes.body.data.register.data.user.id;

    const targetRes = await testUtils.graphqlRequest(registerMutation, {
      input: targetUser,
    });
    targetUserId = targetRes.body.data.register.data.user.id;
  });

  afterAll(async () => {
    if (prisma)
      await prisma.user.deleteMany({
        where: { email: { contains: '@users.test' } },
      });

    await TestUtils.teardownApp(app);
  });

  describe('Queries (Admin Access)', () => {
    it('should allow Admin to fetch any user by ID', async () => {
      const query = `
        query GetUserById($id: String!) {
          getUserById(id: $id) {
            success
            data {
              email
              firstName
            }
          }
        }
      `;
      const response = await testUtils.graphqlRequest(
        query,
        { id: targetUserId },
        adminToken,
      );
      expect(response.body.data.getUserById.data.email).toBe(targetUser.email);
    });

    it('should allow Admin to fetch any user by Email', async () => {
      const query = `
        query GetUserByEmail($email: EmailInput!) {
          getUserByEmail(email: $email) {
            success
            data { id }
          }
        }
      `;
      const response = await testUtils.graphqlRequest(
        query,
        { email: { email: targetUser.email } },
        adminToken,
      );
      expect(response.body.data.getUserByEmail.data.id).toBe(targetUserId);
    });

    it('should allow Admin to list users with pagination', async () => {
      const query = `
        query GetUsers($page: Int, $limit: Int) {
          getUsers(page: $page, limit: $limit) {
            success
            items {
              id
              email
            }
            pagination {
              totalItems
              currentPage
            }
          }
        }
      `;
      const response = await testUtils.graphqlRequest(
        query,
        { page: 1, limit: 10 },
        adminToken,
      );
      expect(response.body.data.getUsers.items.length).toBeGreaterThanOrEqual(
        3,
      );
    });
  });

  describe('Mutations & Role Management', () => {
    it('should allow User to update their own profile', async () => {
      const mutation = `
        mutation UpdateUser($input: UpdateUserDto!) {
          updateUser(updateUserDto: $input) {
            success
            data {
                firstName
                lastName
            }
          }
        }
      `;
      const response = await testUtils.graphqlRequest(
        mutation,
        {
          input: { firstName: 'UpdatedName', lastName: 'NewLast' },
        },
        userToken,
      );

      expect(response.body.data.updateUser.success).toBe(true);
      expect(response.body.data.updateUser.data.firstName).toBe('Updatedname'); // Normalized by CapitalTextField

      // Verify Cache Consistency
      const cachedUser = await redisService.get(`user:${standardUserId}`);
      expect(cachedUser.firstName).toBe('Updatedname');
    });

    it('should allow Admin to promote a User to ADMIN', async () => {
      const mutation = `
        mutation Promote($id: String!) {
          UpdateUserRoleToAdmin(id: $id) {
            message
            data {
              role
            }
          }
        }
      `;
      const response = await testUtils.graphqlRequest(
        mutation,
        { id: targetUserId },
        adminToken,
      );
      expect(response.body.data.UpdateUserRoleToAdmin.data.role).toBe(
        Role.ADMIN,
      );
    });

    it('should allow Admin to delete a user', async () => {
      const query = `
        query DeleteUser($id: String!) {
          deleteUser(id: $id) {
            success
            message
          }
        }
      `;
      const response = await testUtils.graphqlRequest(
        query,
        { id: targetUserId },
        adminToken,
      );
      expect(response.body.data.deleteUser.message).toBeDefined();

      const userInDb = await prisma.user.findUnique({
        where: { id: targetUserId },
      });
      expect(userInDb).toBeNull();

      // Verify Cache Consistency (Invalidation)
      const cachedUserById = await redisService.get(`user:${targetUserId}`);
      const cachedUserByEmail = await redisService.get(`user:email:${targetUser.email}`);
      expect(cachedUserById).toBeNull();
      expect(cachedUserByEmail).toBeNull();
      expect(userInDb).toBeNull();
    });
  });

  describe('Access Control', () => {
    it('should reject Standard User from viewing all users', async () => {
      const query = `
        query GetUsers {
          getUsers {
            success
          }
        }
      `;
      const response = await testUtils.graphqlRequest(query, {}, userToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'You do not have permission',
      );
    });

    it('should reject unauthenticated requests', async () => {
      const query = `
        query GetUsers {
          getUsers {
            success
          }
        }
      `;
      const response = await testUtils.graphqlRequest(query, {});
      expect(response.body.errors).toBeDefined();
    });
  });
});
