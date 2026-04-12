import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/database/prisma.service';
import { User } from 'src/modules/users/entity/user.entity';
import { Role } from 'src/common/constant/enum.constant';
import { GoogleUserData } from './interface/google.interface';
import { UserFactory } from 'src/modules/users/factory/user.factory';

@Injectable()
export class OAuthService {
  constructor(private readonly prisma: PrismaService) {}

  async validateUser(userData: GoogleUserData): Promise<User> {
    const userResult = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: userData.email }, { googleId: userData.googleId }],
      },
    });

    if (userResult) {
      if (!userResult.googleId) {
        const updatedUser = await this.prisma.user.update({
          where: { id: userResult.id },
          data: { googleId: userData.googleId },
        });
        return UserFactory.fromPrisma(updatedUser);
      }
      return UserFactory.fromPrisma(userResult);
    }

    const userCount = await this.prisma.user.count();
    const role = userCount === 0 ? Role.ADMIN : Role.USER;

    const newUser = await this.prisma.user.create({
      data: {
        email: userData.email,
        googleId: userData.googleId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: role,
        headline:"Junior Developer"
      },
    });

    return UserFactory.fromPrisma(newUser);
  }
}
