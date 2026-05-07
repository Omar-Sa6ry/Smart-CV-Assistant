import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/common/database/prisma.service';
import { TestUtils } from './test-utils';
import { Role } from '../src/common/constant/enum.constant';
import { EmploymentType } from '@prisma/client';

describe('Experience (e2e)', () => {
  jest.setTimeout(90000);
  let app: INestApplication;
  let prisma: PrismaService;
  let testUtils: TestUtils;
  let token: string;
  let otherToken: string;
  let userId: string;
  let otherUserId: string;
  let cvId: string;
  let experienceId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    prisma = app.get<PrismaService>(PrismaService);
    testUtils = new TestUtils(app);

    // Create a main user
    const user = await prisma.user.create({
      data: {
        firstName: 'Experience',
        lastName: 'Tester',
        email: `experience-e2e-${Date.now()}@test.com`,
        password: 'password123',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);

    // Create another user for isolation tests
    const otherUser = await prisma.user.create({
      data: {
        firstName: 'Other',
        lastName: 'User',
        email: `other-experience-e2e-${Date.now()}@test.com`,
        password: 'password123',
        role: Role.USER,
      },
    });
    otherUserId = otherUser.id;
    otherToken = await testUtils.generateToken(otherUser as any);

    // Create a CV for the main user
    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Main CV',
        headline: 'Software Engineer',
        summary: 'Experienced developer',
        phone: '123456789',
        location: 'Cairo, Egypt',
      },
    });
    cvId = cv.id;
  });

  afterAll(async () => {
    if (prisma) {
      const ids = [userId, otherUserId].filter(Boolean);
      if (ids.length > 0) {
        await prisma.experience.deleteMany({ where: { userId: { in: ids } } });
        await prisma.cv.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
      }
    }
    await TestUtils.teardownApp(app);
  });

  describe('createExperience', () => {
    it('should create a new experience successfully', async () => {
      const mutation = `
        mutation CreateExperience($data: CreateExperienceInput!) {
          createExperience(data: $data) {
            data {
              id
              jobTitle
              companyName
              companyWebsite
              location
              description
              employmentType
              startDate
              isCurrentJob
            }
            statusCode
            message
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          jobTitle: 'Senior Software Engineer',
          companyName: 'Google',
          companyWebsite: 'https://google.com',
          location: 'Mountain View, CA',
          description: 'Working on awesome things\nLine 2',
          employmentType: EmploymentType.full_time,
          startDate: new Date('2020-01-01').toISOString(),
          isCurrentJob: true,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      
      if (response.body.errors) {
        throw new Error(`Create Experience failed: ${JSON.stringify(response.body.errors, null, 2)}`);
      }

      expect(response.body.data?.createExperience?.statusCode).toBe(201);
      experienceId = response.body.data.createExperience.data.id;
      expect(response.body.data.createExperience.data.jobTitle).toBe('Senior Software Engineer');
      expect(response.body.data.createExperience.data.companyName).toBe('Google');
    });

    it('should fail to create experience for a CV owned by another user', async () => {
      const mutation = `
        mutation CreateExperience($data: CreateExperienceInput!) {
          createExperience(data: $data) {
            data { id }
          }
        }
      `;

      const variables = {
        data: {
          cvId, // Main user's CV
          jobTitle: 'Steal Job',
          companyName: 'Hackers Inc',
          companyWebsite: 'https://hack.com',
          location: 'Unknown',
          description: 'Try to steal',
          employmentType: EmploymentType.part_time,
          startDate: new Date().toISOString(),
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('cv not found');
    });
  });

  describe('Queries', () => {
    it('should get experience by id with resolved fields', async () => {
      const query = `
        query GetExperienceById($id: String!) {
          getExperienceById(id: $id) {
            data {
              id
              descriptionBullets
              user { id email }
              cv { id title }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: experienceId }, token);
      
      if (response.body.errors) {
        throw new Error(`Get Experience failed: ${JSON.stringify(response.body.errors, null, 2)}`);
      }

      const experience = response.body.data.getExperienceById.data;
      expect(experience.id).toBe(experienceId);
      expect(experience.descriptionBullets).toEqual(['Working on awesome things', 'Line 2']);
      expect(experience.user.id).toBe(userId);
      expect(experience.cv.id).toBe(cvId);
    });

    it('should get experiences by CV id', async () => {
      const query = `
        query GetExperiencesByCvId($cvId: String!) {
          getExperiencesByCvId(cvId: $cvId) {
            items { id jobTitle }
            pagination { totalItems }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.body.data.getExperiencesByCvId.items).toHaveLength(1);
      expect(response.body.data.getExperiencesByCvId.pagination.totalItems).toBe(1);
    });

    it('should get experiences by user id', async () => {
      const query = `
        query GetExperiencesByUserId {
          getExperiencesByUserId {
            items { id jobTitle }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.body.data.getExperiencesByUserId.items).toHaveLength(1);
    });

    it('should fail to get experience of another user', async () => {
      const query = `
        query GetExperienceById($id: String!) {
          getExperienceById(id: $id) { data { id } }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: experienceId || '00000000-0000-4000-a000-000000000000' }, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('not found');
    });
  });

  describe('updateExperience', () => {
    it('should update experience successfully', async () => {
      const mutation = `
        mutation UpdateExperience($id: String!, $data: UpdateExperienceInput!) {
          updateExperience(id: $id, data: $data) {
            data {
              id
              jobTitle
            }
            message
          }
        }
      `;

      const variables = {
        id: experienceId,
        data: {
          jobTitle: 'Principal Software Engineer',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.body.data.updateExperience.data.jobTitle).toBe('Principal Software Engineer');
    });

    it('should fail to update experience of another user', async () => {
      const mutation = `
        mutation UpdateExperience($id: String!, $data: UpdateExperienceInput!) {
          updateExperience(id: $id, data: $data) {
            data { id }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: experienceId || '00000000-0000-4000-a000-000000000000', data: { jobTitle: 'Hack' } }, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('not found');
    });
  });

  describe('deleteExperience', () => {
    it('should delete experience successfully', async () => {
      const mutation = `
        mutation DeleteExperience($id: String!) {
          deleteExperience(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: experienceId }, token);
      expect(response.body.data.deleteExperience.message).toBeDefined();

      const checkQuery = `
        query GetExperienceById($id: String!) {
          getExperienceById(id: $id) { data { id } }
        }
      `;
      const checkRes = await testUtils.graphqlRequest(checkQuery, { id: experienceId }, token);
      expect(checkRes.body.errors).toBeDefined();
    });
  });
});
