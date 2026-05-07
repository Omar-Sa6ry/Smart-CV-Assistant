import { NotificationService, RedisService, ChannelType } from '@bts-soft/core';
import { SendResetPasswordEmailCommand, SendWelcomeEmailCommand, CacheUserAuthCommand, UpdateLastLoginCommand } from './auth.command';
import { User } from 'src/modules/users/entity/user.entity';
import { PrismaService } from 'src/common/database/prisma.service';

describe('AuthCommands', () => {
  const mockNotificationService = { send: jest.fn() };
  const mockRedisService = { set: jest.fn() };
  const mockPrismaService = { user: { updateMany: jest.fn() } };

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('SendResetPasswordEmailCommand', () => {
    it('should call notificationService.send with correct parameters', async () => {
      const email = 'test@example.com';
      const link = 'http://reset.link';
      const command = new SendResetPasswordEmailCommand(
        mockNotificationService as any,
        email,
        link,
      );

      await command.execute();

      expect(mockNotificationService.send).toHaveBeenCalledWith(ChannelType.EMAIL, {
        recipientId: email,
        subject: 'Forgot Password',
        body: expect.stringContaining(link),
      });
    });
  });

  describe('SendWelcomeEmailCommand', () => {
    it('should call notificationService.send with correct parameters', async () => {
      const email = 'test@example.com';
      const command = new SendWelcomeEmailCommand(
        mockNotificationService as any,
        email,
      );

      await command.execute();

      expect(mockNotificationService.send).toHaveBeenCalledWith(ChannelType.EMAIL, {
        recipientId: email,
        subject: 'Register in App',
        body: expect.stringContaining('successfully'),
      });
    });
  });

  describe('CacheUserAuthCommand', () => {
    it('should call redisService.set for both ID and Email keys', async () => {
      const mockUser = { id: '1', email: 'test@example.com' } as User;
      const command = new CacheUserAuthCommand(
        mockRedisService as any,
        mockUser,
      );

      await command.execute();

      expect(mockRedisService.set).toHaveBeenCalledTimes(2);
      expect(mockRedisService.set).toHaveBeenCalledWith('user:1', mockUser);
      expect(mockRedisService.set).toHaveBeenCalledWith('user:email:test@example.com', mockUser);
    });
  });

  describe('UpdateLastLoginCommand', () => {
    it('should call prisma.user.updateMany with correct parameters', async () => {
      const userId = 'user-1';
      const command = new UpdateLastLoginCommand(
        mockPrismaService as any,
        userId,
      );

      await command.execute();

      expect(mockPrismaService.user.updateMany).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lastLoginAt: expect.any(Date) },
      });
    });

    it('should not call prisma if userId is missing', async () => {
      const command = new UpdateLastLoginCommand(mockPrismaService as any, '');

      await command.execute();

      expect(mockPrismaService.user.updateMany).not.toHaveBeenCalled();
    });
  });
});
