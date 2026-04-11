import { BadRequestException, Injectable } from '@nestjs/common';
import { UserResponse, UsersResponse } from './dto/UserResponse.dto';
import { UserProxy } from './proxy/user.proxy';
import { CacheObserver } from './observer/user.observer';
import { Limit, Page } from 'src/common/constant/messages.constant';
import { PrismaService } from 'src/common/database/prisma.service';
import { I18nService } from 'nestjs-i18n';
import { UpdateUserDto } from './inputs/UpdateUser.dto';
import { UserFactory } from './factory/user.factory';
import { UserRoleContext } from './state/user.state';
import { User } from './entity/user.entity';
import { Role } from 'src/common/constant/enum.constant';
import { PasswordServiceAdapter } from '../auth/adapter/password.adapter';

@Injectable()
export class UserService {
  constructor(
    private readonly proxy: UserProxy,
    private readonly cacheObserver: CacheObserver,
    private readonly prisma: PrismaService,
    private readonly i18n: I18nService,
    private readonly passwordStrategy: PasswordServiceAdapter,
  ) {}

  async findById(id: string): Promise<UserResponse> {
    return this.proxy.findById(id);
  }

  async findByEmail(email: string): Promise<UserResponse> {
    return this.proxy.findByEmail(email);
  }

  async findUsers(
    page: number = Page,
    limit: number = Limit,
  ): Promise<UsersResponse> {
    return this.proxy.findUsers(page, limit);
  }

  async update(
    updateUserDto: UpdateUserDto,
    id: string,
  ): Promise<UserResponse> {
    const response = await this.proxy.findById(id);
    const user = response.data;

    if (!user)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));

    UserFactory.update(user, updateUserDto);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {
      id: _,
      createdAt,
      updatedAt,
      password,
      googleId,
      ...updateData
    } = user;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const mappedUser = UserFactory.fromPrisma(updatedUser);
    await this.cacheObserver.onUserUpdate(mappedUser);

    return { data: mappedUser };
  }

  async delete(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));

    await this.prisma.user.delete({ where: { id: user.id } });
    await this.cacheObserver.onUserDelete(user.id, user.email);

    return { message: await this.i18n.t('user.DELETED'), data: null };
  }

  async editUserRole(id: string): Promise<UserResponse> {
    const userResult = await this.prisma.user.findUnique({ where: { id } });
    if (!userResult)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));

    const user = UserFactory.fromPrisma(userResult);
    const roleContext = new UserRoleContext(user);
    await roleContext.promote(user);

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, createdAt, updatedAt, ...updateData } = user;
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const mappedUser = UserFactory.fromPrisma(updatedUser);
    await this.cacheObserver.onUserUpdate(mappedUser);

    return {
      data: mappedUser,
      message: await this.i18n.t('user.UPDATED'),
    };
  }
  async createUser(createUserDto: any): Promise<User> {
    return await this.prisma.$transaction(async (tx) => {
      await this.proxy.dataExisted(createUserDto.email);

      const password = await this.passwordStrategy.hash(createUserDto.password);

      const userCount = await tx.user.count();
      const role = userCount === 0 ? Role.ADMIN : Role.USER;

      const newUser = await tx.user.create({
        data: {
          ...createUserDto,
          password,
          role,
        },
      });

      return UserFactory.fromPrisma(newUser);
    });
  }
}
