import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';
import { Degree, Proficiency, SkillCategory, SkillProficiency, EmploymentType } from '@prisma/client';

describe('CV (e2e)', () => {
  jest.setTimeout(90000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    const user = await prisma.user.create({
      data: {
        firstName: 'CV',
        lastName: 'Tester',
        email: `cv-e2e-${Date.now()}@example.com`,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.cv.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await TestUtils.teardownApp(app);
  });

  describe('createCv', () => {
    it('should create a basic CV', async () => {
      const mutation = `
        mutation CreateCv($data: CreateCvInput!) {
          createCv(data: $data) {
            data {
              id
              title
              headline
            }
          }
        }
      `;

      const variables = {
        data: {
          title: 'Basic CV',
          headline: 'Junior Developer',
          summary: 'Eager to learn',
          phone: '0123456789',
          location: 'Alexandria, Egypt',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      expect(response.body.data.createCv.data.title).toBe('Basic CV');
    });
  });

  describe('createFullCv', () => {
    it('should create a full CV with all relations', async () => {
      const mutation = `
        mutation CreateFullCv($data: CreateFullCvInput!) {
          createFullCv(data: $data) {
            data {
              id
              title
              experiences { id jobTitle }
              educations { id institution }
              certifications { id name }
              projects { id name }
              languages { id name }
              skills { id name }
            }
          }
        }
      `;

      const variables = {
        data: {
          title: 'Full Stack CV',
          headline: 'Senior Full Stack Engineer',
          summary: 'Expert in Node.js and React',
          phone: '0111222333',
          location: 'Giza, Egypt',
          experiences: [{
            jobTitle: 'Senior Dev',
            companyName: 'Tech Co',
            companyWebsite: 'https://tech.co',
            location: 'Remote',
            startDate: '2020-01-01',
            description: 'Built amazing things',
            employmentType: EmploymentType.full_time,
          }],
          educations: [{
            institution: 'Cairo University',
            title: 'BSc Computer Science',
            degree: Degree.bachelor,
            startDate: '2016-09-01',
            endDate: '2020-06-01',
            description: 'Graduated with honors',
          }],
          certifications: [{
            name: 'AWS Certified Developer',
            issuingOrganization: 'Amazon',
            issueDate: '2022-05-01',
            credentialUrl: 'https://aws.com/cert/123',
          }],
          projects: [{
            name: 'CV Builder App',
            description: 'AI powered CV builder',
            projectUrl: 'https://github.com/omar/cv-builder',
          }],
          languages: [{
            name: 'English',
            proficiency: Proficiency.fluent,
          }],
          skills: [{
            name: 'TypeScript',
            category: SkillCategory.programming_language,
            proficiency: SkillProficiency.expert,
          }],
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.createFullCv;
      expect(data.title).toBe('Full Stack CV');
      expect(data.experiences).toHaveLength(1);
      expect(data.educations).toHaveLength(1);
      expect(data.certifications).toHaveLength(1);
      expect(data.projects).toHaveLength(1);
      expect(data.languages).toHaveLength(1);
      expect(data.skills).toHaveLength(1);
      
      cvId = data.id;
    });
  });

  describe('Queries', () => {
    it('should get user CVs with pagination', async () => {
      const query = `
        query GetUserCvs($pagination: PaginationInput) {
          getUserCvs(pagination: $pagination) {
            items { id title }
            pagination { totalItems }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { pagination: { page: 1, limit: 10 } }, token);
      expect(response.status).toBe(200);
      expect(response.body.data.getUserCvs.items.length).toBeGreaterThanOrEqual(2);
    });

    it('should get CV by id with all relations (DataLoaders)', async () => {
      const query = `
        query GetCvById($id: String!) {
          getCvById(id: $id) {
            data {
              id
              experiences { jobTitle }
              educations { institution }
              certifications { name }
              projects { name }
              languages { name }
              skills { name }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: cvId }, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.getCvById;
      expect(data.experiences[0].jobTitle).toBe('Senior Dev');
      expect(data.educations[0].institution).toBe('Cairo University');
      expect(data.skills[0].name).toBe('TypeScript');
    });
  });

  describe('updateCv', () => {
    it('should update CV basic info', async () => {
      const mutation = `
        mutation UpdateCv($id: String!, $data: UpdateCvInput!) {
          updateCv(id: $id, data: $data) {
            data {
              title
              headline
            }
          }
        }
      `;

      const variables = {
        id: cvId,
        data: {
          title: 'Updated CV Title',
          headline: 'Architect',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.data.updateCv.data.title).toBe('Updated CV Title');
    });
  });

  describe('deleteCv', () => {
    it('should delete CV and all cascade relations', async () => {
      const mutation = `
        mutation DeleteCv($id: String!) {
          deleteCv(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: cvId }, token);
      expect(response.status).toBe(200);
      expect(response.body.data.deleteCv.message).toBeDefined();

      // Verify cascading deletion in DB
      const experiencesCount = await prisma.experience.count({ where: { cvId } });
      const educationsCount = await prisma.education.count({ where: { cvId } });
      expect(experiencesCount).toBe(0);
      expect(educationsCount).toBe(0);
    });
  });
});
