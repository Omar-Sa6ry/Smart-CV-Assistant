import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';

describe('RoleGuard (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;

  let adminToken: string;
  let userToken: string;

  const adminUser = {
    firstName: 'Admin',
    lastName: 'Guard',
    email: 'admin-guard-e2e@users.test',
    password: 'Password123!',
  };

  const standardUser = {
    firstName: 'Standard',
    lastName: 'Guard',
    email: 'standard-guard-e2e@users.test',
    password: 'Password123!',
  };

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    // cleanup any previous runs
    await prisma.user.deleteMany({
      where: { email: { contains: '-guard-e2e@users.test' } },
    });

    const registerMutation = `
      mutation Register($input: CreateUserDto!) {
        register(createUserDto: $input) {
          data { token, user { id } }
        }
      }
    `;

    // Setup Admin
    const adminRes = await testUtils.graphqlRequest(registerMutation, { input: adminUser });
    const adminId = adminRes.body.data.register.data.user.id;
    adminToken = adminRes.body.data.register.data.token;
    await prisma.user.update({ where: { id: adminId }, data: { role: Role.ADMIN } });

    // Setup Standard User
    const userRes = await testUtils.graphqlRequest(registerMutation, { input: standardUser });
    userToken = userRes.body.data.register.data.token;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.user.deleteMany({
        where: { email: { contains: '-guard-e2e@users.test' } },
      });
    }
    await TestUtils.teardownApp(app);
  });

  it('should deny access if no token is provided', async () => {
    const query = `query { getUsers { success } }`;
    const res = await testUtils.graphqlRequest(query, {});
    expect(res.body.errors).toBeDefined();
  });

  it('should deny access if invalid token is provided', async () => {
    const query = `query { getUsers { success } }`;
    const res = await testUtils.graphqlRequest(query, {}, 'invalid-token-string');
    expect(res.body.errors).toBeDefined();
  });

  it('should deny access if user lacks required roles/permissions', async () => {
    const query = `query { getUsers { success } }`;
    const res = await testUtils.graphqlRequest(query, {}, userToken);
    expect(res.body.errors).toBeDefined();
    expect(res.body.errors[0].message).toBeTruthy();
  });

  it('should allow access if user has the correct role and permissions', async () => {
    const query = `query { getUsers(page: 1, limit: 1) { success, items { id } } }`;
    const res = await testUtils.graphqlRequest(query, {}, adminToken);
    
    expect(res.body.errors).toBeUndefined();
    expect(res.body.data.getUsers).toBeDefined();
    expect(res.body.data.getUsers).not.toBeNull();
  });
});
