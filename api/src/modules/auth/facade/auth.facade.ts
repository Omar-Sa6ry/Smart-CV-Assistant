import { BadRequestException, Injectable } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
import { UserService } from 'src/modules/users/users.service';
import { GenerateTokenFactory } from '../jwt/jwt.service';
import { User } from 'src/modules/users/entity/user.entity';
import { AuthResponse } from '../dto/AuthRes.dto';
import { LoginDto } from '../inputs/Login.dto';
import { CreateUserDto } from '../inputs/CreateUserData.dto';
import { Role } from 'src/common/constant/enum.constant';
import { PasswordValidator, RoleValidator } from '../chain/auth.chain';
import { PasswordServiceAdapter } from '../adapter/password.adapter';
import { RedisService, NotificationService } from '@bts-soft/core';
import { AuthService } from '../auth.service';
import { ResetPasswordDto } from '../inputs/ResetPassword.dto';
import { UserResponse } from 'src/modules/users/dto/UserResponse.dto';
import { ChangePasswordDto } from '../inputs/ChangePassword.dto';
import { ICommand } from '../interfaces/ICommand.interface';
import {
  CacheUserAuthCommand,
  SendWelcomeEmailCommand,
  UpdateLastLoginCommand,
} from '../command/auth.command';
import { IValidator } from '../interfaces/IValidator.interface';
import { PrismaService } from 'src/common/database/prisma.service';

@Injectable()
export class AuthFacade {
  constructor(
    private readonly i18n: I18nService,
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly tokenFactory: GenerateTokenFactory,
    private readonly passwordAdapter: PasswordServiceAdapter,
    private readonly redisService: RedisService,
    private readonly notificationService: NotificationService,
    private readonly prisma: PrismaService,
  ) {}

  async register(createUserDto: CreateUserDto): Promise<AuthResponse> {
    const user = await this.userService.createUser(createUserDto);

    const postAuthCommands: ICommand[] = [
      new UpdateLastLoginCommand(this.prisma, user.id),
      new CacheUserAuthCommand(this.redisService, user),
      new SendWelcomeEmailCommand(this.notificationService, user.email),
    ];

    return this.authenticate(user, postAuthCommands);
  }

  async login(loginDto: LoginDto): Promise<AuthResponse> {
    const user = await this.validateUserExistence(loginDto.email);

    const isValid = await this.passwordAdapter.compare(
      loginDto.password,
      user.password!,
    );
    if (!isValid)
      throw new BadRequestException(
        await this.i18n.t('user.INVALID_CREDENTIALS'),
      );

    const postAuthCommands: ICommand[] = [
      new UpdateLastLoginCommand(this.prisma, user.id),
      new CacheUserAuthCommand(this.redisService, user),
    ];

    return this.authenticate(user, postAuthCommands);
  }

  async roleBasedLogin(loginDto: LoginDto, role: Role): Promise<AuthResponse> {
    const user = await this.validateUserExistence(loginDto.email);

    const passwordValidator = new PasswordValidator(
      this.i18n,
      this.passwordAdapter,
      loginDto.password,
    );
    const roleValidator = new RoleValidator(this.i18n, role);
    passwordValidator.setNext(roleValidator);
    await passwordValidator.validate(user);

    const postAuthCommands: ICommand[] = [
      new UpdateLastLoginCommand(this.prisma, user.id),
      new CacheUserAuthCommand(this.redisService, user),
    ];

    return this.authenticate(user, postAuthCommands);
  }

  async forgotPassword(email: string): Promise<AuthResponse> {
    return this.authService.forgotPassword(email);
  }

  async resetPassword(
    resetPasswordDto: ResetPasswordDto,
  ): Promise<UserResponse> {
    return this.authService.resetPassword(resetPasswordDto);
  }

  async changePassword(
    id: string,
    changePasswordDto: ChangePasswordDto,
  ): Promise<UserResponse> {
    return this.authService.changePassword(id, changePasswordDto);
  }

  private async authenticate(
    user: User,
    commands: ICommand[],
  ): Promise<AuthResponse> {
    const tokenGenerator = await this.tokenFactory.createTokenGenerator();
    const token = await tokenGenerator.generate(user.email, user.id);

    for (const command of commands) {
      await command.execute();
    }

    return {
      data: { user, token },
      message: await this.i18n.t('user.LOGIN'),
    };
  }

  private async validateUserExistence(email: string): Promise<User> {
    const userResult = await this.userService.findByEmail(email);
    if (!userResult || !userResult.data)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));

    return userResult.data;
  }
}
