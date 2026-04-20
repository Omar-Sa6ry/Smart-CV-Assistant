import { Test, TestingModule } from '@nestjs/testing';
import { CacheObserver } from './user.observer';
import { RedisService } from '@bts-soft/core';
import { User } from 'src/modules/users/entity/user.entity';

describe('CacheObserver', () => {
  let observer: CacheObserver;
  let redis: RedisService;

  const mockRedis = {
    set: jest.fn(),
    del: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CacheObserver,
        { provide: RedisService, useValue: mockRedis },
      ],
    }).compile();

    observer = module.get<CacheObserver>(CacheObserver);
    redis = module.get<RedisService>(RedisService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onUserUpdate', () => {
    it('should update both ID and Email keys in redis', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;

      await observer.onUserUpdate(mockUser);

      expect(redis.set).toHaveBeenCalledTimes(2);
      expect(redis.set).toHaveBeenCalledWith('user:1', mockUser);
      expect(redis.set).toHaveBeenCalledWith('user:email:test@example.com', mockUser);
    });
  });

  describe('onUserDelete', () => {
    it('should delete both ID and Email keys from redis', async () => {
      await observer.onUserDelete('1', 'test@example.com');

      expect(redis.del).toHaveBeenCalledTimes(2);
      expect(redis.del).toHaveBeenCalledWith('user:1');
      expect(redis.del).toHaveBeenCalledWith('user:email:test@example.com');
    });
  });
});
