import { Test, TestingModule } from '@nestjs/testing';
import { UserProxy } from './user.proxy';
import { PrismaService } from 'src/common/database/prisma.service';
import { RedisService } from '@bts-soft/core';
import { I18nService } from 'nestjs-i18n';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { UserFactory } from '../factory/user.factory';

describe('UserProxy', () => {
  let proxy: UserProxy;
  let prisma: PrismaService;
  let redis: RedisService;
  let i18n: I18nService;

  const mockUserPayload = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'USER',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockRedis = {
    get: jest.fn(),
    set: jest.fn(),
  };

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => Promise.resolve(key)),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserProxy,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: RedisService, useValue: mockRedis },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    proxy = module.get<UserProxy>(UserProxy);
    prisma = module.get<PrismaService>(PrismaService);
    redis = module.get<RedisService>(RedisService);
    i18n = module.get<I18nService>(I18nService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return cached user if exists', async () => {
      mockRedis.get.mockResolvedValue(mockUserPayload);

      const result = await proxy.findById('1');

      expect(redis.get).toHaveBeenCalledWith('user:1');
      expect(result).toEqual({ data: mockUserPayload });
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    it('should fetch from prisma and cache if not in redis', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUserPayload);

      const result = await proxy.findById('1');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: '1' } });
      expect(redis.set).toHaveBeenCalledWith('user:1', expect.any(Object));
      expect(redis.set).toHaveBeenCalledWith(`user:email:${mockUserPayload.email}`, expect.any(Object));
      expect(result.data).toBeDefined();
    });

    it('should throw NotFoundException if user does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(proxy.findById('1')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByEmail', () => {
    it('should return cached user by email', async () => {
      mockRedis.get.mockResolvedValue(mockUserPayload);

      const result = await proxy.findByEmail('test@example.com');

      expect(redis.get).toHaveBeenCalledWith('user:email:test@example.com');
      expect(result).toEqual({ data: mockUserPayload });
    });

    it('should fetch from prisma by email if not in redis', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUserPayload);

      const result = await proxy.findByEmail('test@example.com');

      expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
      expect(redis.set).toHaveBeenCalledTimes(2);
      expect(result.data).toBeDefined();
    });
  });

  describe('findUsers', () => {
    it('should return paginated users', async () => {
      const mockItems = [mockUserPayload];
      const mockTotal = 1;
      mockPrisma.user.findMany.mockResolvedValue(mockItems);
      mockPrisma.user.count.mockResolvedValue(mockTotal);

      const result = await proxy.findUsers(1, 10);

      expect(result.items).toHaveLength(1);
      expect(result!.pagination!.totalItems).toBe(mockTotal);
      expect(result!.pagination!.totalPages).toBe(1);
    });

    it('should throw NotFoundException if no users found', async () => {
      mockPrisma.user.findMany.mockResolvedValue([]);
      mockPrisma.user.count.mockResolvedValue(0);

      await expect(proxy.findUsers(1, 10)).rejects.toThrow(NotFoundException);
    });
  });

  describe('dataExisted', () => {
    it('should throw BadRequestException if email exists in cache', async () => {
      mockRedis.get.mockResolvedValue(mockUserPayload);

      await expect(proxy.dataExisted('test@example.com')).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if email exists in prisma', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(mockUserPayload);

      await expect(proxy.dataExisted('test@example.com')).rejects.toThrow(BadRequestException);
    });

    it('should not throw if email does not exist', async () => {
      mockRedis.get.mockResolvedValue(null);
      mockPrisma.user.findUnique.mockResolvedValue(null);

      await expect(proxy.dataExisted('new@example.com')).resolves.not.toThrow();
    });
  });
});
