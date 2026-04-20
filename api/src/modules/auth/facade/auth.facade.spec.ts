import { Test, TestingModule } from '@nestjs/testing';
import { AuthFacade } from './auth.facade';
import { UserService } from 'src/modules/users/users.service';
import { AuthService } from '../auth.service';
import { GenerateTokenFactory } from '../jwt/jwt.service';
import { PasswordServiceAdapter } from '../adapter/password.adapter';
import { PrismaService } from 'src/common/database/prisma.service';
import { RedisService, NotificationService } from '@bts-soft/core';
import { I18nService } from 'nestjs-i18n';
import { Role } from 'src/common/constant/enum.constant';
import { BadRequestException } from '@nestjs/common';
import { CreateUserDto } from '../inputs/CreateUserData.dto';

describe('AuthFacade', () => {
  let facade: AuthFacade;
  let userService: UserService;
  let authService: AuthService;
  let tokenFactory: GenerateTokenFactory;
  let passwordAdapter: PasswordServiceAdapter;
  let i18n: I18nService;

  const mockUserPayload = { 
    id: 'user-1', 
    email: 'test@example.com', 
    password: 'hashedpassword', 
    role: Role.USER 
  };

  const mockUserService = {
    createUser: jest.fn().mockResolvedValue(mockUserPayload),
    findByEmail: jest.fn(),
  };

  const mockAuthService = {
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
    changePassword: jest.fn(),
  };

  const mockTokenGenerator = {
    generate: jest.fn().mockResolvedValue('mock-jwt-token'),
  };

  const mockTokenFactory = {
    createTokenGenerator: jest.fn().mockReturnValue(mockTokenGenerator),
  };

  const mockPasswordAdapter = {
    compare: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => Promise.resolve(key)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthFacade,
        { provide: UserService, useValue: mockUserService },
        { provide: AuthService, useValue: mockAuthService },
        { provide: GenerateTokenFactory, useValue: mockTokenFactory },
        { provide: PasswordServiceAdapter, useValue: mockPasswordAdapter },
        { provide: RedisService, useValue: { set: jest.fn() } },
        { provide: NotificationService, useValue: { send: jest.fn() } },
        { provide: PrismaService, useValue: { user: { updateMany: jest.fn() } } },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    facade = module.get<AuthFacade>(AuthFacade);
    userService = module.get<UserService>(UserService);
    authService = module.get<AuthService>(AuthService);
    tokenFactory = module.get<GenerateTokenFactory>(GenerateTokenFactory);
    passwordAdapter = module.get<PasswordServiceAdapter>(PasswordServiceAdapter);
    i18n = module.get<I18nService>(I18nService);
  });

  describe('register', () => {
    it('should register and authenticate user', async () => {
      const dto = { email: 'test@example.com' } as CreateUserDto;
      const result = await facade.register(dto);

      expect(userService.createUser).toHaveBeenCalledWith(dto);
      expect(mockTokenGenerator.generate).toHaveBeenCalled();
      expect(result!.data!.token).toBe('mock-jwt-token');
    });
  });

  describe('login', () => {
    it('should login successfully with correct credentials', async () => {
      mockUserService.findByEmail.mockResolvedValue({ data: mockUserPayload });
      mockPasswordAdapter.compare.mockResolvedValue(true);

      const result = await facade.login({ email: 'test@example.com', password: 'password' });

      expect(mockPasswordAdapter.compare).toHaveBeenCalledWith('password', mockUserPayload.password);
      expect(result!.data!.token).toBe('mock-jwt-token');
    });

    it('should throw BadRequestException on invalid password', async () => {
      mockUserService.findByEmail.mockResolvedValue({ data: mockUserPayload });
      mockPasswordAdapter.compare.mockResolvedValue(false);

      await expect(facade.login({ email: 'test@example.com', password: 'wrong' })).rejects.toThrow(BadRequestException);
    });
  });

  describe('roleBasedLogin', () => {
    it('should login if role matches', async () => {
      mockUserService.findByEmail.mockResolvedValue({ 
        data: { ...mockUserPayload, role: Role.ADMIN } 
      });
      mockPasswordAdapter.compare.mockResolvedValue(true);

      const result = await facade.roleBasedLogin(
        { email: 'admin@example.com', password: 'password' },
        Role.ADMIN
      );

      expect(result!.data!.user.role).toBe(Role.ADMIN);
    });

    it('should throw error if role does not match', async () => {
      mockUserService.findByEmail.mockResolvedValue({ data: mockUserPayload });
      mockPasswordAdapter.compare.mockResolvedValue(true);

      await expect(facade.roleBasedLogin(
        { email: 'test@example.com', password: 'password' },
        Role.ADMIN
      )).rejects.toThrow();
    });
  });
});
