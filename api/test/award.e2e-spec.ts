import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';

describe('Award (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;
  let awardId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    const user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: `award-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);

    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Test CV',
        headline: 'Software Engineer',
        summary: 'A very talented engineer',
        phone: '123456789',
        location: 'Cairo, Egypt',
      },
    });
    cvId = cv.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.award.deleteMany({ where: { userId } });
      await prisma.cv.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await TestUtils.teardownApp(app);
  });

  describe('createAward', () => {
    it('should create an award', async () => {
      const mutation = `
        mutation CreateAward($data: CreateAwardInput!) {
          createAward(data: $data) {
            message
            statusCode
            data {
              id
              title
              issuer
              issueDate
              description
            }
          }
        }
      `;

      const variables = {
        data: {
          title: 'Top Performance Award',
          issuer: 'Tech Corp',
          cvId,
          issueDate: '2023-12-01T00:00:00.000Z',
          description: 'Awarded for exceptional performance in Q4.',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data, statusCode, message } = response.body.data.createAward;
      expect(statusCode).toBe(201);
      expect(data.title).toBe(variables.data.title);
      expect(data.issuer).toBe(variables.data.issuer);
      awardId = data.id;
    });

    it('should fail if CV does not belong to user', async () => {
      const otherUser = await prisma.user.create({
        data: {
          firstName: 'Other',
          lastName: 'User',
          email: `other-award-${Date.now()}@example.com`,
          password: 'Password123!',
          role: Role.USER,
        },
      });
      const otherToken = await testUtils.generateToken(otherUser as any);

      const mutation = `
        mutation CreateAward($data: CreateAwardInput!) {
          createAward(data: $data) {
            message
          }
        }
      `;

      const variables = {
        data: {
          title: 'Unauthorized Award',
          issuer: 'Tech Corp',
          cvId,
          issueDate: '2023-12-01T00:00:00.000Z',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, otherToken);
      expect(response.body.errors).toBeDefined();
      
      await prisma.user.delete({ where: { id: otherUser.id } });
    });
  });

  describe('Queries', () => {
    it('should get award by id with resolved fields', async () => {
      const query = `
        query GetAwardById($id: String!) {
          getAwardById(id: $id) {
            data {
              id
              title
              user { id email }
              cv { id title }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: awardId }, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.getAwardById;
      expect(data.id).toBe(awardId);
      expect(data.user.id).toBe(userId);
      expect(data.cv.id).toBe(cvId);
    });

    it('should get awards by user id', async () => {
      const query = `
        query GetAwardsByUserId($pagination: PaginationInput) {
          getAwardsByUserId(pagination: $pagination) {
            items { id title }
            pagination { totalItems totalPages currentPage }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.status).toBe(200);
      const { items, pagination } = response.body.data.getAwardsByUserId;
      expect(items.length).toBeGreaterThan(0);
      expect(pagination.totalItems).toBe(1);
    });

    it('should get awards by cv id', async () => {
      const query = `
        query GetAwardsByCvId($cvId: String!) {
          getAwardsByCvId(cvId: $cvId) {
            items { id title }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.status).toBe(200);
      const { items } = response.body.data.getAwardsByCvId;
      expect(items.length).toBeGreaterThan(0);
      expect(items[0].id).toBe(awardId);
    });
  });

  describe('updateAward', () => {
    it('should update award details', async () => {
      const mutation = `
        mutation UpdateAward($id: String!, $data: UpdateAwardInput!) {
          updateAward(id: $id, data: $data) {
            message
            data {
              title
              issuer
            }
          }
        }
      `;

      const variables = {
        id: awardId,
        data: {
          title: 'Updated Award Title',
          issuer: 'New Tech Corp',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.data.updateAward.data.title).toBe('Updated Award Title');
      expect(response.body.data.updateAward.data.issuer).toBe('New Tech Corp');
    });
  });

  describe('deleteAward', () => {
    it('should delete the award', async () => {
      const mutation = `
        mutation DeleteAward($id: String!) {
          deleteAward(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: awardId }, token);
      expect(response.status).toBe(200);
      expect(response.body.data.deleteAward.message).toBeDefined();

      // Verify deletion
      const checkQuery = `
        query GetAwardById($id: String!) {
          getAwardById(id: $id) {
            data { id }
          }
        }
      `;
      const checkResponse = await testUtils.graphqlRequest(checkQuery, { id: awardId }, token);
      expect(checkResponse.body.errors).toBeDefined();
    });
  });
});
