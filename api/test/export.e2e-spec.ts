import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';
import request from 'supertest';

describe('Export (e2e)', () => {
  jest.setTimeout(120000);
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

    const userEmail = `export-e2e-${Date.now()}@example.com`;
    const user = await prisma.user.create({
      data: {
        firstName: 'Export',
        lastName: 'Tester',
        email: userEmail,
        password: 'Password123!',
        role: Role.USER,
      },
    });
    userId = user.id;
    token = await testUtils.generateToken(user as any);

    const cv = await prisma.cv.create({
      data: {
        userId,
        title: 'Export Test CV',
        headline: 'Software Engineer',
        summary: 'Testing export functionality with a comprehensive E2E test.',
        location: 'Cairo, Egypt',
        phone: '0123456789',
      },
    });
    cvId = cv.id;
  });

  afterAll(async () => {
    if (prisma) {
      await prisma.cv.deleteMany({ where: { userId } });
      await prisma.user.delete({ where: { id: userId } });
    }
    await TestUtils.teardownApp(app);
  });

  describe('REST - ExportController', () => {
    it('should export CV as classic PDF by default', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cv-export/${cvId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toContain(`attachment; filename="CV_${cvId}.pdf"`);
      expect(response.body).toBeDefined();
    });

    it('should export CV as modern PDF', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cv-export/${cvId}?format=modern`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/pdf');
      expect(response.header['content-disposition']).toContain(`attachment; filename="CV_${cvId}.pdf"`);
    });

    it('should export CV as word document', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cv-export/${cvId}?format=word`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.header['content-disposition']).toContain(`attachment; filename="CV_${cvId}.docx"`);
    });

    it('should export CV as modern word document', async () => {
      const response = await request(app.getHttpServer())
        .get(`/cv-export/${cvId}?format=modern_word`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.header['content-type']).toBe('application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      expect(response.header['content-disposition']).toContain(`attachment; filename="CV_${cvId}.docx"`);
    });

    it('should return 404 for non-existent CV', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request(app.getHttpServer())
        .get(`/cv-export/${fakeId}`)
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GraphQL - ExportResolver', () => {
    const exportCvQuery = `
      query ExportCv($id: String!, $format: String) {
        exportCv(id: $id, format: $format) {
          data {
            fileContent
            fileName
            downloadUrl
          }
          success
          statusCode
        }
      }
    `;

    it('should export CV via GraphQL (classic)', async () => {
      const response = await testUtils.graphqlRequest(exportCvQuery, { id: cvId }, token);
      
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.exportCv;
      expect(data.fileName).toBe(`CV_${cvId}.pdf`);
      expect(data.fileContent).toBeDefined();
      expect(typeof data.fileContent).toBe('string'); // Base64
      expect(data.downloadUrl).toContain(`/cv-export/${cvId}?format=classic`);
    });

    it('should export CV via GraphQL (modern_word)', async () => {
      const response = await testUtils.graphqlRequest(exportCvQuery, { id: cvId, format: 'modern_word' }, token);
      
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeUndefined();
      
      const { data } = response.body.data.exportCv;
      expect(data.fileName).toBe(`CV_${cvId}.docx`);
      expect(data.downloadUrl).toContain('format=modern_word');
    });

    it('should return error for non-existent CV in GraphQL', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await testUtils.graphqlRequest(exportCvQuery, { id: fakeId }, token);
      
      expect(response.status).toBe(200);
      expect(response.body.errors).toBeDefined();
      expect(response.body.errors[0].message).toContain('CV not found');
    });
  });
});
