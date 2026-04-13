import { ChannelType, NotificationService, RedisService } from '@bts-soft/core';
import { ICommand } from '../interfaces/ICommand.interface';
import { User } from 'src/modules/users/entity/user.entity';
import { PrismaService } from 'src/common/database/prisma.service';

export class SendResetPasswordEmailCommand implements ICommand {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly email: string,
    private readonly link: string,
  ) {}

  async execute(): Promise<void> {
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: this.email,
      subject: 'Forgot Password',
      body: `Click here to reset your password: ${this.link}`,
    });
  }
}

export class SendWelcomeEmailCommand implements ICommand {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly email: string,
  ) {}

  async execute(): Promise<void> {
    await this.notificationService.send(ChannelType.EMAIL, {
      recipientId: this.email,
      subject: 'Register in App',
      body: 'You registered successfully in the App',
    });
  }
}

export class CacheUserAuthCommand implements ICommand {
  constructor(
    private readonly redisService: RedisService,
    private readonly user: User,
  ) {}

  async execute(): Promise<void> {
    await this.redisService.set(`user:${this.user.id}`, this.user);
    await this.redisService.set(`user:email:${this.user.email}`, this.user);
  }
}

export class UpdateLastLoginCommand implements ICommand {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userId: string,
  ) {}

  async execute(): Promise<void> {
    if (!this.userId) return;

    await this.prisma.user.updateMany({
      where: { id: this.userId },
      data: { lastLoginAt: new Date() },
    });
  }
}
