import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UserService } from 'src/modules/users/users.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { NotificationService, RedisService } from '@bts-soft/core';
import { PasswordServiceAdapter } from './adapter/password.adapter';
import { BadRequestException } from '@nestjs/common';
import { Role } from 'src/common/constant/enum.constant';

describe('AuthService', () => {
  let service: AuthService;
  let userService: UserService;
  let prisma: PrismaService;
  let redis: RedisService;
  let emailService: NotificationService;
  let i18n: I18nService;
  let passwordStrategy: PasswordServiceAdapter;

  const mockUserPayload = {
    id: 'user-1',
    email: 'user@example.com',
    role: Role.USER,
    password: 'hashed-password',
    resetToken: null,
    resetTokenExpiry: null,
  };

  const mockAdminPayload = {
    id: 'admin-1',
    email: 'admin@example.com',
    role: Role.ADMIN,
  };

  const mockPrisma = {
    user: {
      update: jest.fn(),
      findFirst: jest.fn(),
    },
  };

  const mockUserService = {
    findByEmail: jest.fn(),
    findById: jest.fn(),
  };

  const mockRedis = {
    set: jest.fn(),
  };

  const mockEmailService = {
    send: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => Promise.resolve(key)),
  };

  const mockPasswordStrategy = {
    hash: jest.fn().mockResolvedValue('new-hashed-password'),
    compare: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserService, useValue: mockUserService },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: NotificationService, useValue: mockEmailService },
        { provide: I18nService, useValue: mockI18n },
        { provide: PasswordServiceAdapter, useValue: mockPasswordStrategy },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userService = module.get<UserService>(UserService);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    emailService = module.get<NotificationService>(NotificationService);
    i18n = module.get<I18nService>(I18nService);
    passwordStrategy = module.get<PasswordServiceAdapter>(PasswordServiceAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('forgotPassword', () => {
    it('should throw BadRequestException if user is ADMIN', async () => {
      mockUserService.findByEmail.mockResolvedValue({ data: mockAdminPayload });

      await expect(service.forgotPassword(mockAdminPayload.email)).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith('user.NOT_ADMIN');
    });

    it('should throw BadRequestException if user not found', async () => {
      mockUserService.findByEmail.mockResolvedValue({ data: null });

      await expect(service.forgotPassword('nonexistent@example.com')).rejects.toThrow(BadRequestException);
      expect(i18n.t).toHaveBeenCalledWith('user.NOT_FOUND');
    });

    it('should successfully handle forgot password for standard user', async () => {
      mockUserService.findByEmail.mockResolvedValue({ data: { ...mockUserPayload } });
      mockPrisma.user.update.mockResolvedValue({ ...mockUserPayload });

      const result = await service.forgotPassword(mockUserPayload.email);

      expect(prisma.user.update).toHaveBeenCalled();
      expect(emailService.send).toHaveBeenCalled();
      expect(result.message).toBe('user.SEND_MSG');
    });
  });

  describe('resetPassword', () => {
    it('should throw BadRequestException if token is invalid or expired', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword({ token: 'invalid', password: 'new' })).rejects.toThrow(BadRequestException);
    });

    it('should successfully reset password with valid token', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(mockUserPayload);
      mockPrisma.user.update.mockResolvedValue({ ...mockUserPayload, password: 'new-hashed-password' });

      const result = await service.resetPassword({ token: 'valid-token', password: 'new-password' });

      expect(passwordStrategy.hash).toHaveBeenCalledWith('new-password');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      expect(result.message).toBe('user.UPDATE_PASSWORD');
    });
  });

  describe('changePassword', () => {
    it('should throw BadRequestException if old and new passwords are identical', async () => {
      await expect(service.changePassword('user-1', { 
        password: 'same-password', 
        newPassword: 'same-password' 
      })).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if current password verification fails', async () => {
      mockUserService.findById.mockResolvedValue({ data: mockUserPayload });
      mockPasswordStrategy.compare.mockResolvedValue(false);

      await expect(service.changePassword('user-1', { 
        password: 'wrong-current', 
        newPassword: 'new-password' 
      })).rejects.toThrow(BadRequestException);
    });

    it('should successfully change password', async () => {
      mockUserService.findById.mockResolvedValue({ data: mockUserPayload });
      mockPasswordStrategy.compare.mockResolvedValue(true);
      mockPrisma.user.update.mockResolvedValue({ ...mockUserPayload, password: 'new-hashed-password' });

      const result = await service.changePassword('user-1', { 
        password: 'correct-current', 
        newPassword: 'new-password' 
      });

      expect(passwordStrategy.hash).toHaveBeenCalledWith('new-password');
      expect(prisma.user.update).toHaveBeenCalled();
      expect(redis.set).toHaveBeenCalled();
      expect(result.data).toBeDefined();
    });
  });
});
