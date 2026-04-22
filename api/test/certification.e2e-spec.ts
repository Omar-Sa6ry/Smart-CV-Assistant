import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';

describe('Certification (e2e)', () => {
  jest.setTimeout(60000);
  let app: INestApplication;
  let testUtils: TestUtils;
  let prisma: PrismaService;
  let token: string;
  let userId: string;
  let cvId: string;
  let certId: string;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
    prisma = app.get(PrismaService);

    const user = await prisma.user.create({
      data: {
        firstName: 'Test',
        lastName: 'User',
        email: `cert-e2e-${Date.now()}@example.com`,
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
      await prisma.certification.deleteMany({ where: { userId } });
      await prisma.cv.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await TestUtils.teardownApp(app);
  });

  describe('createCertification', () => {
    it('should create a certification', async () => {
      const mutation = `
        mutation CreateCertification($data: CreateCertificationInput!) {
          createCertification(data: $data) {
            message
            data {
              id
              name
              issuingOrganization
              issueDate
            }
          }
        }
      `;

      const variables = {
        data: {
          name: 'AWS Solutions Architect',
          issuingOrganization: 'Amazon',
          cvId,
          issueDate: '2023-01-01',
          credentialUrl: 'https://aws.amazon.com/certification/certified-solutions-architect-associate/',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.createCertification;
      expect(data.name).toBe(variables.data.name);
      certId = data.id;
    });
  });

  describe('Queries', () => {
    it('should get certification by id', async () => {
      const query = `
        query GetCertificationById($id: String!) {
          getCertificationById(id: $id) {
            data {
              id
              name
              user { id email }
              cv { id title }
            }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { id: certId }, token);
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.getCertificationById;
      expect(data.id).toBe(certId);
      expect(data.user.id).toBe(userId);
      expect(data.cv.id).toBe(cvId);
    });

    it('should get certifications by user id', async () => {
      const query = `
        query GetCertificationsByUserId {
          getCertificationsByUserId {
            items { id name }
            pagination { totalItems }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, {}, token);
      expect(response.status).toBe(200);
      const { items } = response.body.data.getCertificationsByUserId;
      expect(items.length).toBeGreaterThan(0);
    });

    it('should get certifications by cv id', async () => {
      const query = `
        query GetCertificationsByCvId($cvId: String!) {
          getCertificationsByCvId(cvId: $cvId) {
            items { id name }
          }
        }
      `;

      const response = await testUtils.graphqlRequest(query, { cvId }, token);
      expect(response.status).toBe(200);
      const { items } = response.body.data.getCertificationsByCvId;
      expect(items.length).toBeGreaterThan(0);
    });
  });

  describe('updateCertification', () => {
    it('should update certification', async () => {
      const mutation = `
        mutation UpdateCertification($id: String!, $data: UpdateCertificationInput!) {
          updateCertification(id: $id, data: $data) {
            message
            data {
              name
            }
          }
        }
      `;

      const variables = {
        id: certId,
        data: {
          name: 'Updated Name',
        },
      };

      const response = await testUtils.graphqlRequest(mutation, variables, token);
      expect(response.status).toBe(200);
      expect(response.body.data.updateCertification.data.name).toBe('Updated Name');
    });
  });

  describe('deleteCertification', () => {
    it('should delete certification', async () => {
      const mutation = `
        mutation DeleteCertification($id: String!) {
          deleteCertification(id: $id) {
            message
          }
        }
      `;

      const response = await testUtils.graphqlRequest(mutation, { id: certId }, token);
      expect(response.status).toBe(200);
      expect(response.body.data.deleteCertification.message).toBeDefined();

      const checkQuery = `
        query GetCertificationById($id: String!) {
          getCertificationById(id: $id) {
            data { id }
          }
        }
      `;
      const checkResponse = await testUtils.graphqlRequest(checkQuery, { id: certId }, token);
      expect(checkResponse.body.errors).toBeDefined();
    });
  });
});
