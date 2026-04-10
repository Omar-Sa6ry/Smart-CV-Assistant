import { BadRequestException, Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../inputs/UpdateUser.dto';
import { UserResponse } from '../dto/UserResponse.dto';
import { I18nService } from 'nestjs-i18n';
import { User as PrismaUser } from '@prisma/client';
import { UserProxy } from '../proxy/user.proxy';
import { UserFactory } from '../factory/user.factory';
import { CacheObserver } from '../observer/user.observer';
import { UserRoleContext } from '../state/user.state';
import { RedisService } from '@bts-soft/core';
import { PrismaService } from 'src/common/database/prisma.service';
import { User as UserEntity } from '../entity/user.entity';

@Injectable()
export class UserFacadeService {
  private proxy: UserProxy;
  private observers: CacheObserver;

  constructor(
    private readonly i18n: I18nService,
    private readonly redisService: RedisService,
    private readonly prisma: PrismaService,
  ) {
    this.proxy = new UserProxy(this.i18n, this.redisService, this.prisma);
    this.observers = new CacheObserver(this.redisService);
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

    // Explicitly destructure to strip non-updatable fields and satisfy Prisma types
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { id: _, createdAt, updatedAt, password, googleId, ...updateData } = user;

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateData,
    });

    const mappedUser = UserFactory.fromPrisma(updatedUser);
    await this.notifyUpdate(mappedUser);

    return { data: mappedUser };
  }

  async deleteUser(id: string): Promise<UserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user)
      throw new BadRequestException(await this.i18n.t('user.NOT_FOUND'));

    await this.prisma.user.delete({ where: { id: user.id } });
    await this.notifyDelete(user.id, user.email);

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
    await this.notifyUpdate(mappedUser);

    return {
      data: mappedUser,
      message: await this.i18n.t('user.UPDATED'),
    };
  }

  private async notifyUpdate(user: UserEntity): Promise<void> {
    await this.observers.onUserUpdate(user);
  }

  private async notifyDelete(userId: string, email: string): Promise<void> {
    await this.observers.onUserDelete(userId, email);
  }
}
