import { I18nService } from 'nestjs-i18n';
import { UserService } from 'src/modules/users/users.service';
import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from 'src/modules/users/entity/user.entity';
import { AuthResponse } from './dto/AuthRes.dto';
import { Role } from 'src/common/constant/enum.constant';
import { PasswordResetLinkBuilder } from './builder/PasswordResetLink.builder';
import { UserResponse } from '../users/dto/UserResponse.dto';
import { ResetPasswordDto } from './inputs/ResetPassword.dto';
import { PasswordServiceAdapter } from './adapter/password.adapter';
import { ChangePasswordDto } from './inputs/ChangePassword.dto';
import { NotificationService, RedisService } from '@bts-soft/core';
import { IPasswordStrategy } from './interfaces/IPassword.interface';
import { SendResetPasswordEmailCommand } from './command/auth.command';
import { PrismaService } from 'src/common/database/prisma.service';
import { UserFactory } from '../users/factory/user.factory';
import {
  CompletedResetState,
  InitialResetState,
  PasswordResetContext,
} from './state/auth.state';

@Injectable()
export class AuthService {
  private passwordStrategy: IPasswordStrategy;

  constructor(
    private readonly i18n: I18nService,
    private readonly userService: UserService,
    private readonly redisService: RedisService,
    private readonly emailService: NotificationService,
    private readonly prisma: PrismaService,
  ) {
    this.passwordStrategy = new PasswordServiceAdapter();
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    const user = await this.validateUserForPasswordReset(email);

    const builder = new PasswordResetLinkBuilder();
    const link = builder.build();
    const token = builder.getToken();

    const resetContext = new PasswordResetContext(new InitialResetState());
    await resetContext.execute(user, token);
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken: user.resetToken,
        resetTokenExpiry: user.resetTokenExpiry,
      },
    });

    const emailCommand = new SendResetPasswordEmailCommand(
      this.emailService,
      email,
      link,
    );
    emailCommand.execute();

    return { message: await this.i18n.t('user.SEND_MSG'), data: null };
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<UserResponse> {
    const user = await this.validateResetToken(resetPasswordDto.token);
    user.password = await this.passwordStrategy.hash(resetPasswordDto.password);

    const resetContext = new PasswordResetContext(new CompletedResetState());
    await resetContext.execute(user);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: user.password,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    this.redisService.set(`user:${user.id}`, user);

    return {
      message: await this.i18n.t('user.UPDATE_PASSWORD'),
      data: user,
    };
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponse> {
    if (changePasswordDto.password === changePasswordDto.newPassword)
      throw new BadRequestException(
        await this.i18n.t('user.LOGISANE_PASSWORD'),
      );

    const user = await this.validateUserForPasswordChange(
      id,
      changePasswordDto.password,
    );

    user.password = await this.passwordStrategy.hash(
      changePasswordDto.newPassword,
    );
    
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: user.password },
    });

    return {
      message: await this.i18n.t('user.UPDATE_PASSWORD'),
      data: user,
    };
  }

  // ====================== Private helper methods =====================

  private async validateUserForPasswordReset(email: string): Promise<User> {
    const user = await this.userService.findByEmail(email);

    if (!user || !user.data)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));

    if ([Role.ADMIN].includes(user.data.role))
      throw new BadRequestException(await this.i18n.t('user.NOT_ADMIN'));

    return user.data;
  }

  private async validateResetToken(token: string): Promise<User> {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date(),
        },
      },
    });

    if (!user)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));
    
    return UserFactory.fromPrisma(user);
  }

  private async validateUserForPasswordChange(
    id: string,
    currentPassword: string,
  ): Promise<User> {
    const user = await this.userService.findById(id);
    if (!user || !user.data)
      throw new BadRequestException(await this.i18n.t('user.EMAIL_WRONG'));

    const isMatch = await this.passwordStrategy.compare(
      currentPassword,
      user.data.password ?? '',
    );
    if (!isMatch)
      throw new BadRequestException(await this.i18n.t('user.OLD_IS_EQUAL_NEW'));

    return user.data;
  }
}
