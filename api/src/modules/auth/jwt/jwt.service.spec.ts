import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { GenerateTokenFactory, TokenGenerator } from './jwt.service';

describe('JWT Logic', () => {
  let factory: GenerateTokenFactory;
  let jwtService: JwtService;

  const mockJwtService = {
    signAsync: jest.fn().mockResolvedValue('mock-token'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GenerateTokenFactory,
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    factory = module.get<GenerateTokenFactory>(GenerateTokenFactory);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('GenerateTokenFactory', () => {
    it('should create a TokenGenerator instance', () => {
      const generator = factory.createTokenGenerator();
      expect(generator).toBeInstanceOf(TokenGenerator);
    });
  });

  describe('TokenGenerator', () => {
    it('should generate a token with correct payload and secret', async () => {
      const secret = 'test-secret';
      const email = 'test@example.com';
      const id = 'user-1';
      const generator = new TokenGenerator(jwtService as any, secret);

      const result = await generator.generate(email, id);

      expect(jwtService.signAsync).toHaveBeenCalledWith(
        { email, id },
        { secret: secret }
      );
      expect(result).toBe('mock-token');
    });
  });
});
