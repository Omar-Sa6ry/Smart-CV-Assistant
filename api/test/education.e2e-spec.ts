import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';
import { Degree } from '@prisma/client';

describe('Education (e2e)', () => {
  jest.setTimeout(90000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;
  let educationId: string;

  let otherToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    const user = await prisma.user.create({
      data: {
        firstName: 'Education',
        lastName: 'Tester',
        email: `edu-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);

    const otherUser = await prisma.user.create({
      data: {
        firstName: 'Other',
        lastName: 'User',
        email: `other-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    otherUserId = otherUser.id;
    otherToken = await testUtils.generateToken(otherUser as any);

    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Education Test CV',
        headline: 'Student',
        summary: 'Learning things',
        phone: '0123456789',
        location: 'Cairo, Egypt',
      },
    });
    cvId = cv.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.education.deleteMany({
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

  describe('createEducation', () => {
    it('should create an education record', async () => {
      const mutation = `
        mutation CreateEducation($data: CreateEducationInput!) {
          createEducation(data: $data) {
            message
            data {
              id
              institution
              title
              degree
              gpa
            }
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          institution: 'Cairo University',
          title: 'Computer Science',
          degree: Degree.bachelor,
          description: 'Faculty of Computers and Artificial Intelligence',
          gpa: 3.8,
          startDate: '2016-09-01',
          endDate: '2020-06-30',
        },
      };

      const response = await testUtils.graphqlRequest(
        mutation,
        variables,
        token,
      );
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body.data.createEducation;
      expect(data.institution).toBe('Cairo University');
      expect(data.gpa).toBe(3.8);
      educationId = data.id;
    });

    it('should fail to create education for a CV owned by another user', async () => {
      const mutation = `
        mutation CreateEducation($data: CreateEducationInput!) {
          createEducation(data: $data) {
            message
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          institution: 'Hack University',
          title: 'Hacking',
          degree: Degree.master,
          description: 'Access denied',
          startDate: '2022-01-01',
        },
      };

      const response = await testUtils.graphqlRequest(
        mutation,
        variables,
        otherToken,
      );
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('CV not found');
    });

    it('should fail with validation error for invalid GPA', async () => {
      const mutation = `
        mutation CreateEducation($data: CreateEducationInput!) {
          createEducation(data: $data) {
            message
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          institution: 'Test Univ',
          title: 'Test Degree',
          degree: Degree.bachelor,
          description: 'Test',
          gpa: 5.0, // Max is 4.0
          startDate: '2020-01-01',
        },
      };

      const response = await testUtils.graphqlRequest(
        mutation,
        variables,
        token,
      );
      expect(response.body.errors).toBeDefined();
    });
  });

  describe('Queries', () => {
    it('should get education by id with relations', async () => {
      const query = `
        query GetEducationById($id: String!) {
          getEducationById(id: $id) {
            data {
              id
              institution
              user { id email }
              cv { id title }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(
        query,
        { id: educationId },
        token,
      );
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();

      const { data } = response.body.data.getEducationById;
      expect(data.id).toBe(educationId);
      expect(data.user.id).toBe(userId);
      expect(data.cv.id).toBe(cvId);
    });

    it('should fail to get education owned by another user', async () => {
      const query = `
        query GetEducationById($id: String!) {
          getEducationById(id: $id) {
            data { id }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(
        query,
        { id: educationId },
        otherToken,
      );
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'education.NOT_PERMISSION',
      );
    });

    it('should test pagination for getEducationsByUserId', async () => {
      await prisma.education.create({
        data: {
          userId,
          cvId,
          institution: 'Second University',
          title: 'Master',
          degree: Degree.master,
          description: 'Second description',
          startDate: new Date('2021-01-01'),
        },
      });

      const query = `
        query GetEducationsByUserId($pagination: PaginationInput) {
          getEducationsByUserId(pagination: $pagination) {
            items { id institution }
            pagination { totalItems totalPages }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(
        query,
        { pagination: { page: 1, limit: 1 } },
        token,
      );
      expect(response.status).toBe(200);
      const { items, pagination } = response.body.data.getEducationsByUserId;
      expect(items).toHaveLength(1);
      expect(pagination.totalItems).toBeGreaterThanOrEqual(2);
    });

    it('should get educations by cv id', async () => {
      const query = `
        query GetEducationsByCvId($cvId: String!) {
          getEducationsByCvId(cvId: $cvId) {
            items { id institution }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.status).toBe(200);
      const { items } = response.body.data.getEducationsByCvId;
      expect(items.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('updateEducation', () => {
    it('should update education record', async () => {
      const mutation = `
        mutation UpdateEducation($id: String!, $data: UpdateEducationInput!) {
          updateEducation(id: $id, data: $data) {
            data {
              institution
              gpa
            }
          }
        }
      `;

      const variables = {
        id: educationId,
        data: {
          institution: 'Updated University',
          gpa: 4.0,
        },
      };

      const response = await testUtils.graphqlRequest(
        mutation,
        variables,
        token,
      );
      expect(response.status).toBe(200);
      expect(response.body.data.updateEducation.data.institution).toBe(
        'Updated University',
      );
    });

    it('should fail to update education owned by another user', async () => {
      const mutation = `
        mutation UpdateEducation($id: String!, $data: UpdateEducationInput!) {
          updateEducation(id: $id, data: $data) {
            message
          }
        }
      `;

      const variables = {
        id: educationId,
        data: { institution: 'Malicious Update' },
      };

      const response = await testUtils.graphqlRequest(
        mutation,
        variables,
        otherToken,
      );
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'education.NOT_PERMISSION',
      );
    });

    it('should fail to change education to a CV owned by another user', async () => {
      const otherCv = await prisma.cv.create({
        data: {
          userId: otherUserId,
          title: 'Other CV',
          headline: 'Other',
          summary: 'Other',
          phone: '999',
          location: 'Other',
        },
      });

      const mutation = `
        mutation UpdateEducation($id: String!, $data: UpdateEducationInput!) {
          updateEducation(id: $id, data: $data) {
            message
          }
        }
      `;

      const variables = {
        id: educationId,
        data: { cvId: otherCv.id },
      };

      const response = await testUtils.graphqlRequest(
        mutation,
        variables,
        token,
      );
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('CV not found');
    });
  });

  describe('deleteEducation', () => {
    it('should fail to delete education owned by another user', async () => {
      const mutation = `
        mutation DeleteEducation($id: String!) {
          deleteEducation(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(
        mutation,
        { id: educationId },
        otherToken,
      );
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain(
        'education.NOT_PERMISSION',
      );
    });

    it('should delete education record', async () => {
      const mutation = `
        mutation DeleteEducation($id: String!) {
          deleteEducation(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(
        mutation,
        { id: educationId },
        token,
      );

      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.deleteEducation.message).toBeDefined();

      const checkQuery = `
        query GetEducationById($id: String!) {
          getEducationById(id: $id) {
            data { id }
          }
        }
      `;
      const checkResponse = await testUtils.graphqlRequest(
        checkQuery,
        { id: educationId },
        token,
      );
      expect(checkResponse.body.errors).toBeDefined();
    });
  });
});
