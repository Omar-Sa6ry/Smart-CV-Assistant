import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';
import { Degree } from '@prisma/client';

describe('Education (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;
  let educationId: string;

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
      await prisma.education.deleteMany({ where: { userId } });
      await prisma.cv.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
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

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.createEducation;
      expect(data.institution).toBe('Cairo University');
      expect(data.gpa).toBe(3.8);
      educationId = data.id;
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

      const response = await testUtils.graphqlRequest(query, { id: educationId }, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.getEducationById;
      expect(data.id).toBe(educationId);
      expect(data.user.id).toBe(userId);
      expect(data.cv.id).toBe(cvId);
    });

    it('should get educations by user id', async () => {
      const query = `
        query GetEducationsByUserId {
          getEducationsByUserId {
            items { id institution }
            pagination { totalItems }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.status).toBe(200);
      const { items } = response.body.data.getEducationsByUserId;
      expect(items.length).toBeGreaterThan(0);
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
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('updateEducation', () => {
    it('should update education record', async () => {
      const mutation = `
        mutation UpdateEducation($id: String!, $data: UpdateEducationInput!) {
          updateEducation(id: $id, data: $data) {
            message
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

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.data.updateEducation.data.institution).toBe('Updated University');
      expect(response.body.data.updateEducation.data.gpa).toBe(4.0);
    });
  });

  describe('deleteEducation', () => {
    it('should delete education record', async () => {
      const mutation = `
        mutation DeleteEducation($id: String!) {
          deleteEducation(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: educationId }, token);
      expect(response.status).toBe(200);
      expect(response.body.data.deleteEducation.message).toBeDefined();

      // Verify deletion
      const checkQuery = `
        query GetEducationById($id: String!) {
          getEducationById(id: $id) {
            data { id }
          }
        }
      `;
      const checkResponse = await testUtils.graphqlRequest(checkQuery, { id: educationId }, token);
      expect(checkResponse.body.errors).toBeDefined();
    });
  });
});
