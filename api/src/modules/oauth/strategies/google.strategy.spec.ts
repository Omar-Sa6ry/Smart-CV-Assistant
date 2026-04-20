import { GoogleStrategy } from './google.strategy';

describe('GoogleStrategy', () => {
  let strategy: GoogleStrategy;

  beforeEach(() => {
    process.env.GOOGLE_CLIENT_ID = 'test-client-id';
    process.env.GOOGLE_CLIENT_SECRET = 'test-client-secret';
    process.env.GOOGLE_CALLBACK = 'http://localhost/callback';

    strategy = new GoogleStrategy();
  });

  afterEach(() => {
    delete process.env.GOOGLE_CLIENT_ID;
    delete process.env.GOOGLE_CLIENT_SECRET;
    delete process.env.GOOGLE_CALLBACK;
  });

  describe('validate', () => {
    it('should correctly parse profile data with full names', async () => {
      const mockProfile: any = {
        id: 'google-1',
        displayName: 'John Doe',
        emails: [{ value: 'john@example.com' }],
        name: {
          givenName: 'John',
          familyName: 'Doe',
        },
      };

      const result = await strategy.validate(null, 'access', 'refresh', mockProfile);

      expect(result).toEqual({
        googleId: 'google-1',
        email: 'john@example.com',
        firstName: 'John',
        lastName: 'Doe',
      });
    });

    it('should fallback to splitting displayName if name object is missing', async () => {
      const mockProfile: any = {
        id: 'google-2',
        displayName: 'Jane Mary Watson',
        emails: [{ value: 'jane@example.com' }],
      };

      const result = await strategy.validate(null, 'access', 'refresh', mockProfile);

      expect(result.firstName).toBe('Jane');
      expect(result.lastName).toBe('Mary Watson');
    });

    it('should return empty strings if emails are missing', async () => {
       const mockProfile: any = {
        id: 'google-3',
        displayName: 'NoEmail User',
        emails: [],
      };

      const result = await strategy.validate(null, 'access', 'refresh', mockProfile);
      expect(result.email).toBe('');
    });
  });
});
