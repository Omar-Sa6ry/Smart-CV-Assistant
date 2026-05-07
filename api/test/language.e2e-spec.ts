import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';
import { Proficiency } from '@prisma/client';

describe('Language (e2e)', () => {
  jest.setTimeout(90000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;
  let languageId: string;

  let otherToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    // Create main test user
    const user = await prisma.user.create({
      data: {
        firstName: 'Language',
        lastName: 'Tester',
        email: `lang-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);

    // Create other user for authorization tests
    const otherUser = await prisma.user.create({
      data: {
        firstName: 'Other',
        lastName: 'User',
        email: `other-lang-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    otherUserId = otherUser.id;
    otherToken = await testUtils.generateToken(otherUser as any);

    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Language Test CV',
        headline: 'Polyglot',
        summary: 'Expert in multiple languages with over 10 years of international experience.',
        phone: '01012345678',
        location: 'Cairo, Egypt',
      },
    });
    cvId = cv.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.language.deleteMany({
        where: { userId: { in: [userId, otherUserId] } },
      });
      await prisma.cv.deleteMany({
        where: { userId: { in: [userId, otherUserId] } },
      });
      await prisma.user.deleteMany({
        where: { id: { in: [userId, otherUserId] } },
      });
    }
    await TestUtils.teardownApp(app);
  });

  describe('createLanguage', () => {
    const mutation = `
      mutation CreateLanguage($data: CreateLanguageInput!) {
        createLanguage(data: $data) {
          message
          data {
            id
            name
            proficiency
          }
        }
      }
    `;

    it('should create a language successfully', async () => {
      const variables = {
        data: {
          cvId,
          name: 'English',
          proficiency: Proficiency.fluent,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body.data.createLanguage;
      expect(data.name).toBe('English');
      expect(data.proficiency).toBe(Proficiency.fluent);
      languageId = data.id;
    });

    it('should fail if language already exists in the same CV', async () => {
      const variables = {
        data: {
          cvId,
          name: 'English',
          proficiency: Proficiency.native,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('is already added');
    });

    it('should fail to create language for a CV owned by another user', async () => {
      const variables = {
        data: {
          cvId,
          name: 'French',
          proficiency: Proficiency.basic
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('CV not found');
    });
  });

  describe('Queries', () => {
    it('should get language by id with relations', async () => {
      const query = `
        query GetLanguageById($id: String!) {
          getLanguageById(id: $id) {
            data {
              id
              name
              user { id email }
              cv { id title }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: languageId }, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body.data.getLanguageById;
      expect(data.id).toBe(languageId);
      expect(data.user.id).toBe(userId);
      expect(data.cv.id).toBe(cvId);
    });

    it('should fail to get language owned by another user', async () => {
      const query = `
        query GetLanguageById($id: String!) {
          getLanguageById(id: $id) {
            data { id }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: languageId }, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('Language record not found');
    });

    it('should get languages by CV ID', async () => {
      const query = `
        query GetLanguagesByCvId($cvId: String!) {
          getLanguagesByCvId(cvId: $cvId) {
            items { id name }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.status).toBe(200);
      expect(response.body.data.getLanguagesByCvId.items).toHaveLength(1);
      expect(response.body.data.getLanguagesByCvId.items[0].name).toBe('English');
    });

    it('should get languages by user ID (Current User)', async () => {
      const query = `
        query GetLanguagesByUserId {
          getLanguagesByUserId {
            items { id name }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.status).toBe(200);
      expect(response.body.data.getLanguagesByUserId.items).toHaveLength(1);
    });
  });

  describe('updateLanguage', () => {
    const mutation = `
      mutation UpdateLanguage($id: String!, $data: UpdateLanguageInput!) {
        updateLanguage(id: $id, data: $data) {
          message
          data {
            id
            name
            proficiency
          }
        }
      }
    `;

    it('should update language successfully', async () => {
      const variables = {
        id: languageId,
        data: {
          name: 'English Updated',
          proficiency: Proficiency.native,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.data.updateLanguage.data.name).toBe('English Updated');
      expect(response.body.data.updateLanguage.data.proficiency).toBe(Proficiency.native);
    });

    it('should fail to update language owned by another user', async () => {
      const variables = {
        id: languageId,
        data: { name: 'Malicious Update' },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, otherToken);
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('deleteLanguage', () => {
    const mutation = `
      mutation DeleteLanguage($id: String!) {
        deleteLanguage(id: $id) {
          message
        }
      }
    `;

    it('should fail to delete language owned by another user', async () => {
      const response = await testUtils.graphqlRequest(mutation, { id: languageId }, otherToken);
      expect(response.body.errors).toBeDefined();
    });

    it('should delete language successfully', async () => {
      const response = await testUtils.graphqlRequest(mutation, { id: languageId }, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteLanguage.message).toBeDefined();

      // Verify deletion
      const checkQuery = `
        query GetLanguageById($id: String!) {
          getLanguageById(id: $id) {
            data { id }
          }
        }
      `;
      const checkResponse = await testUtils.graphqlRequest(checkQuery, { id: languageId }, token);
      expect(checkResponse.body.errors).toBeDefined();
    });
  });
});
