import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './users.service';
import { UserProxy } from './proxy/user.proxy';
import { CacheObserver } from './observer/user.observer';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { PasswordServiceAdapter } from '../auth/adapter/password.adapter';
import { BadRequestException } from '@nestjs/common';
import { Role } from 'src/common/constant/enum.constant';
import { UserFactory } from './factory/user.factory';

describe('UserService', () => {
  let service: UserService;
  let proxy: UserProxy;
  let cacheObserver: CacheObserver;
  let prisma: PrismaService;
  let i18n: I18nService;
  let passwordStrategy: PasswordServiceAdapter;

  const mockUserPayload = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: Role.USER,
    password: 'hashedpassword',
  };

  const mockPrisma = {
    user: {
      update: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
    $transaction: jest.fn().mockImplementation((callback) => callback(mockPrisma)),
  };

  const mockProxy = {
    findById: jest.fn(),
    findByEmail: jest.fn(),
    findUsers: jest.fn(),
    dataExisted: jest.fn(),
  };

  const mockCacheObserver = {
    onUserUpdate: jest.fn(),
    onUserDelete: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => Promise.resolve(key)),
  };

  const mockPasswordStrategy = {
    hash: jest.fn().mockResolvedValue('hashedpassword'),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        { provide: UserProxy, useValue: mockProxy },
        { provide: CacheObserver, useValue: mockCacheObserver },
        { provide: PrismaService, useValue: mockPrisma },
        { provide: I18nService, useValue: mockI18n },
        { provide: PasswordServiceAdapter, useValue: mockPasswordStrategy },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    proxy = module.get<UserProxy>(UserProxy);
    cacheObserver = module.get<CacheObserver>(CacheObserver);
    prisma = module.get<PrismaService>(PrismaService);
    i18n = module.get<I18nService>(I18nService);
    passwordStrategy = module.get<PasswordServiceAdapter>(PasswordServiceAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('update', () => {
    it('should update user successfully', async () => {
      mockProxy.findById.mockResolvedValue({ data: { ...mockUserPayload } });
      mockPrisma.user.update.mockResolvedValue(mockUserPayload);

      const result = await service.update({ name: 'Updated Name' } as any, '1');

      expect(prisma.user.update).toHaveBeenCalled();
      expect(cacheObserver.onUserUpdate).toHaveBeenCalled();
      expect(result.success).toBe(true);
    });

    it('should throw BadRequestException if user not found', async () => {
      mockProxy.findById.mockResolvedValue({ data: null });

      await expect(service.update({ name: 'Name' } as any, '1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('delete', () => {
    it('should delete user and notify observer', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserPayload);

      const result = await service.delete('1');

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(cacheObserver.onUserDelete).toHaveBeenCalledWith('1', mockUserPayload.email);
      expect(result.data).toBeNull();
    });

    it('should throw BadRequestException if user to delete not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(service.delete('1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('editUserRole', () => {
    it('should promote user role successfully', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(mockUserPayload);
      mockPrisma.user.update.mockResolvedValue({ ...mockUserPayload, role: Role.ADMIN });

      const result = await service.editUserRole('1');

      expect(result!.data!.role).toBe(Role.ADMIN);
      expect(cacheObserver.onUserUpdate).toHaveBeenCalled();
    });
  });

  describe('createUser', () => {
    it('should create a new user with ADMIN role if it is the first user', async () => {
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.create.mockResolvedValue({ ...mockUserPayload, role: Role.ADMIN });

      const result = await service.createUser({ email: 'test@example.com', password: 'password' });

      expect(proxy.dataExisted).toHaveBeenCalled();
      expect(passwordStrategy.hash).toHaveBeenCalled();
      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: Role.ADMIN })
      }));
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should create a new user with USER role if others exist', async () => {
      mockPrisma.user.count.mockResolvedValue(1);
      mockPrisma.user.create.mockResolvedValue({ ...mockUserPayload, role: Role.USER });

      const result = await service.createUser({ email: 'test@example.com', password: 'password' });

      expect(result.role).toBe(Role.USER);
    });
  });
});
