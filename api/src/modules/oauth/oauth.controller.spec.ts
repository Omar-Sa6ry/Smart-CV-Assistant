import { Test, TestingModule } from '@nestjs/testing';
import { OAuthController } from './oauth.controller';
import { OAuthService } from './oauth.service';
import { GenerateTokenFactory } from 'src/modules/auth/jwt/jwt.service';

describe('OAuthController', () => {
  let controller: OAuthController;
  let oauthService: OAuthService;
  let tokenFactory: GenerateTokenFactory;

  const mockOAuthService = {
    validateUser: jest.fn(),
  };

  const mockTokenGenerator = {
    generate: jest.fn().mockResolvedValue('mock-token'),
  };

  const mockTokenFactory = {
    createTokenGenerator: jest.fn().mockResolvedValue(mockTokenGenerator),
  };

  const mockResponse = {
    redirect: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OAuthController],
      providers: [
        { provide: OAuthService, useValue: mockOAuthService },
        { provide: GenerateTokenFactory, useValue: mockTokenFactory },
      ],
    }).compile();

    controller = module.get<OAuthController>(OAuthController);
    oauthService = module.get<OAuthService>(OAuthService);
    tokenFactory = module.get<GenerateTokenFactory>(GenerateTokenFactory);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('googleCallback', () => {
    it('should redirect to frontend with token on success', async () => {
      const mockUser = { id: '1', email: 'test@example.com' };
      const req = { user: { googleId: 'g-1' } };
      
      mockOAuthService.validateUser.mockResolvedValue(mockUser);

      await controller.googleCallback(req, mockResponse);

      expect(oauthService.validateUser).toHaveBeenCalledWith(req.user);
      expect(mockTokenGenerator.generate).toHaveBeenCalledWith(mockUser.email, mockUser.id);
      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('token=mock-token')
      );
    });

    it('should redirect with error parameter if authentication fails', async () => {
      const req = { user: { googleId: 'g-1' } };
      const error = new Error('Auth failed');
      
      mockOAuthService.validateUser.mockRejectedValue(error);

      await controller.googleCallback(req, mockResponse);

      expect(mockResponse.redirect).toHaveBeenCalledWith(
        expect.stringContaining('error=Auth%20failed')
      );
    });
  });
});
