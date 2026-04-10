import { Injectable } from '@nestjs/common';
import { UpdateUserDto } from '../inputs/UpdateUser.dto';
import { User as UserEntity } from '../entity/user.entity';
import { User as PrismaUser } from '@prisma/client';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class UserFactory {
  static fromPrisma(user: PrismaUser): UserEntity {
    return plainToInstance(UserEntity, user);
  }

  static fromPrismaArray(users: PrismaUser[]): UserEntity[] {
    return plainToInstance(UserEntity, users);
  }

  static update(
    user: UserEntity,
    updateUserDto: UpdateUserDto,
  ): UserEntity {
    Object.assign(user, updateUserDto);
    return user;
  }
}
