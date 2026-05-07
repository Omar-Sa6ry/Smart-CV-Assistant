import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';

describe('Project (e2e)', () => {
  jest.setTimeout(90000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;
  let projectId: string;

  let otherToken: string;
  let otherUserId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    // Create main test user
    const user = await prisma.user.create({
      data: {
        firstName: 'Project',
        lastName: 'Tester',
        email: `project-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);

    // Create another user
    const otherUser = await prisma.user.create({
      data: {
        firstName: 'Other',
        lastName: 'User',
        email: `other-project-${Date.now()}@example.com`,
        password: 'Password123!',
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
        await prisma.project.deleteMany({ where: { userId: { in: ids } } });
        await prisma.cv.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
      }
    }
    await TestUtils.teardownApp(app);
  });

  describe('createProject', () => {
    it('should create a new project successfully', async () => {
      const mutation = `
        mutation CreateProject($data: CreateProjectInput!) {
          createProject(data: $data) {
            data {
              id
              name
              description
              projectUrl
            }
            statusCode
            message
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          name: 'Portfolio Project',
          description: 'A beautiful portfolio\nLine 2',
          projectUrl: 'https://omar.com',
          startDate: new Date('2023-01-01').toISOString(),
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      
      if (response.body.errors) {
        throw new Error(`Create Project failed: ${JSON.stringify(response.body.errors, null, 2)}`);
      }

      expect(response.body.data?.createProject?.statusCode).toBe(201);
      projectId = response.body.data.createProject.data.id;
      expect(response.body.data.createProject.data.name).toBe('Portfolio Project');
    });

    it('should fail to create project for a CV owned by another user', async () => {
      const mutation = `
        mutation CreateProject($data: CreateProjectInput!) {
          createProject(data: $data) {
            data { id }
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          name: 'Steal Project',
          description: 'Try to steal',
          projectUrl: 'https://hack.com',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('cv not found');
    });
  });

  describe('Queries', () => {
    it('should get project by id with resolved fields', async () => {
      const query = `
        query GetProjectById($id: String!) {
          getProjectById(id: $id) {
            data {
              id
              name
              descriptionBullets
              user { id firstName }
              cv { id title }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: projectId }, token);
      
      const project = response.body.data.getProjectById.data;
      expect(project.id).toBe(projectId);
      expect(project.descriptionBullets).toEqual(['A beautiful portfolio', 'Line 2']);
      expect(project.user.id).toBe(userId);
      expect(project.cv.id).toBe(cvId);
    });

    it('should get projects by CV id', async () => {
      const query = `
        query GetProjectsByCvId($cvId: String!) {
          getProjectsByCvId(cvId: $cvId) {
            items { id name }
            pagination { totalItems }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.body.data.getProjectsByCvId.items).toHaveLength(1);
      expect(response.body.data.getProjectsByCvId.pagination.totalItems).toBe(1);
    });

    it('should get projects by user id', async () => {
      const query = `
        query GetProjectsByUserId {
          getProjectsByUserId {
            items { id name }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.body.data.getProjectsByUserId.items).toHaveLength(1);
    });

    it('should fail to get project of another user', async () => {
      const query = `
        query GetProjectById($id: String!) {
          getProjectById(id: $id) {
            data { id }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: projectId || '00000000-0000-4000-a000-000000000000' }, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('not found');
    });
  });

  describe('updateProject', () => {
    it('should update project successfully', async () => {
      const mutation = `
        mutation UpdateProject($id: String!, $data: UpdateProjectInput!) {
          updateProject(id: $id, data: $data) {
            data { name }
            message
          }
        }
      `;

      const variables = {
        id: projectId,
        data: {
          name: 'Updated Portfolio',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.body.data.updateProject.data.name).toBe('Updated Portfolio');
    });

    it('should fail to update project of another user', async () => {
      const mutation = `
        mutation UpdateProject($id: String!, $data: UpdateProjectInput!) {
          updateProject(id: $id, data: $data) {
            data { id }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: projectId || '00000000-0000-4000-a000-000000000000', data: { name: 'Hack' } }, otherToken);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('not found');
    });
  });

  describe('deleteProject', () => {
    it('should delete project successfully', async () => {
      const mutation = `
        mutation DeleteProject($id: String!) {
          deleteProject(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: projectId }, token);
      expect(response.body.data.deleteProject.message).toBeDefined();

      const checkQuery = `
        query GetProjectById($id: String!) {
          getProjectById(id: $id) { data { id } }
        }
      `;
      const checkRes = await testUtils.graphqlRequest(checkQuery, { id: projectId }, token);
      expect(checkRes.body.errors).toBeDefined();
    });
  });
});
