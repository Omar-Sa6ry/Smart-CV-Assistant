import { INestApplication } from '@nestjs/common';
import { TestUtils } from './test-utils';

describe('AppResolver (e2e)', () => {
  let app: INestApplication;
  let testUtils: TestUtils;

  beforeAll(async () => {
    app = await TestUtils.createTestApp();
    testUtils = new TestUtils(app);
  });

  afterAll(async () => {
    await TestUtils.teardownApp(app);
  });

  it('sayHello (Query)', async () => {
    const query = `
      query {
        sayHello
      }
    `;

    const response = await testUtils.graphqlRequest(query);

    expect(response.status).toBe(200);
    expect(response.body.data.sayHello).toBe('Hello in Smart CV Assistant');
  });
});
