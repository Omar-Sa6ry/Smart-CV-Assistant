import { INestApplication } from '@nestjs/common';
import { PrismaService } from '../src/common/database/prisma.service';
import { TestUtils } from './test-utils';
import { Role } from '../src/common/constant/enum.constant';
import { SkillProficiency, SkillCategory } from '@prisma/client';

describe('Skill (e2e)', () => {
  jest.setTimeout(90000);
  let app: INestApplication;
  let prisma: PrismaService;
  let testUtils: TestUtils;
  let token: string;
  let otherToken: string;
  let userId: string;
  let otherUserId: string;
  let cvId: string;
  let skillId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    prisma = app.get<PrismaService>(PrismaService);
    testUtils = new TestUtils(app);

    // Create a main user
    const user = await prisma.user.create({
      data: {
        firstName: 'Skill',
        lastName: 'Tester',
        email: `skill-e2e-${Date.now()}@test.com`,
        password: 'password123',
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
        email: `other-skill-e2e-${Date.now()}@test.com`,
        password: 'password123',
        role: Role.USER,
      },
    });
    otherUserId = otherUser.id;
    otherToken = await testUtils.generateToken(otherUser as any);

    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Main CV',
        headline: 'Engineer',
        summary: 'Expert',
        phone: '123456',
        location: 'Earth',
      },
    });
    cvId = cv.id;
  });

  afterAll(async () => {
    if (prisma) {
      const ids = [userId, otherUserId].filter(Boolean);
      if (ids.length > 0) {
        await prisma.skill.deleteMany({ where: { userId: { in: ids } } });
        await prisma.cv.deleteMany({ where: { userId: { in: ids } } });
        await prisma.user.deleteMany({ where: { id: { in: ids } } });
      }
    }
    await TestUtils.teardownApp(app);
  });

  describe('createSkill', () => {
    it('should create a new skill successfully and create keyword', async () => {
      const mutation = `
        mutation CreateSkill($data: CreateSkillInput!) {
          createSkill(data: $data) {
            data {
              id
              name
              proficiency
              category
              keyword {
                id
                name
                popularityScore
              }
            }
            statusCode
            message
          }
        }
      `;

      const variables = {
        data: {
          cvId,
          name: 'NestJS',
          proficiency: SkillProficiency.advanced,
          category: SkillCategory.backend,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      
      if (response.body.errors) {
        throw new Error(`Create Skill failed: ${JSON.stringify(response.body.errors, null, 2)}`);
      }

      expect(response.body.data.createSkill.statusCode).toBe(201);
      skillId = response.body.data.createSkill.data.id;
      expect(response.body.data.createSkill.data.name).toBe('NestJS');
      expect(response.body.data.createSkill.data.keyword.popularityScore).toBe(1);
    });

    it('should increment popularity score for existing keyword', async () => {
      // Create another CV for same user to add same skill
      const cv2 = await prisma.cv.create({
        data: { userId, title: 'CV 2', headline: 'X', summary: 'Y', phone: '1', location: 'Z' }
      });

      const mutation = `
        mutation CreateSkill($data: CreateSkillInput!) {
          createSkill(data: $data) {
            data {
              keyword { popularityScore }
            }
          }
        }
      `;

      const variables = {
        data: {
          cvId: cv2.id,
          name: 'NestJS',
          proficiency: SkillProficiency.expert,
          category: SkillCategory.backend,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.body.data.createSkill.data.keyword.popularityScore).toBe(2);
    });

    it('should fail to create duplicate skill in same CV', async () => {
      const mutation = `
        mutation CreateSkill($data: CreateSkillInput!) {
          createSkill(data: $data) { data { id } }
        }
      `;

      const variables = {
        data: {
          cvId,
          name: 'NestJS',
          proficiency: SkillProficiency.beginner,
          category: SkillCategory.backend,
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message.toLowerCase()).toContain('already added');
    });
  });

  describe('Queries', () => {
    it('should get skill by id with relations', async () => {
      const query = `
        query GetSkillById($id: String!) {
          getSkillById(id: $id) {
            data {
              id
              name
              user { id email }
              cv { id title }
              keyword { id name }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: skillId }, token);
      const skill = response.body.data.getSkillById.data;
      expect(skill.id).toBe(skillId);
      expect(skill.user.id).toBe(userId);
      expect(skill.cv.id).toBe(cvId);
      expect(skill.keyword.name).toBe('NestJS');
    });

    it('should get skills by CV id', async () => {
      const query = `
        query GetSkillsByCvId($cvId: String!) {
          getSkillsByCvId(cvId: $cvId) {
            items { id name }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.body.data.getSkillsByCvId.items).toHaveLength(1);
    });

    it('should get skills by user id', async () => {
      const query = `
        query GetSkillsByUserId {
          getSkillsByUserId {
            items { id name }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.body.data.getSkillsByUserId.items.length).toBeGreaterThan(0);
    });

    it('should search skill keywords', async () => {
      const query = `
        query SearchSkillKeywords($data: SearchSkillKeywordInput!) {
          searchSkillKeywords(data: $data) {
            items { id name popularityScore }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { data: { query: 'Nest' } }, token);
      expect(response.body.data.searchSkillKeywords.items.length).toBeGreaterThan(0);
      expect(response.body.data.searchSkillKeywords.items[0].name).toBe('NestJS');
    });
  });

  describe('updateSkill', () => {
    it('should update skill proficiency', async () => {
      const mutation = `
        mutation UpdateSkill($id: String!, $data: UpdateSkillInput!) {
          updateSkill(id: $id, data: $data) {
            data { proficiency }
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, {
        id: skillId,
        data: { proficiency: SkillProficiency.expert }
      }, token);

      expect(response.body.data.updateSkill.data.proficiency).toBe(SkillProficiency.expert);
    });
  });

  describe('deleteSkill', () => {
    it('should delete skill successfully', async () => {
      const mutation = `
        mutation DeleteSkill($id: String!) {
          deleteSkill(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: skillId }, token);
      expect(response.body.data.deleteSkill.message).toBeDefined();

      const checkQuery = `
        query GetSkillById($id: String!) {
          getSkillById(id: $id) { data { id } }
        }
      `;
      const checkRes = await testUtils.graphqlRequest(checkQuery, { id: skillId }, token);
      expect(checkRes.body.errors).toBeDefined();
    });
  });
});
