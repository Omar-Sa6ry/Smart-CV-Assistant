import { UserFactory } from './user.factory';
import { User as UserEntity } from '../entity/user.entity';
import { User as PrismaUser } from '@prisma/client';
import { UpdateUserDto } from '../inputs/UpdateUser.dto';

describe('UserFactory', () => {
  const mockPrismaUser: PrismaUser = {
    id: '1',
    email: 'test@example.com',
    password: 'hashedpassword',
    name: 'Test User',
    role: 'USER',
    googleId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  } as any;

  describe('fromPrisma', () => {
    it('should map a Prisma user to a UserEntity', () => {
      const result = UserFactory.fromPrisma(mockPrismaUser);
      expect(result).toBeInstanceOf(UserEntity);
      expect(result.id).toBe(mockPrismaUser.id);
      expect(result.email).toBe(mockPrismaUser.email);
    });
  });

  describe('fromPrismaArray', () => {
    it('should map an array of Prisma users to an array of UserEntities', () => {
      const result = UserFactory.fromPrismaArray([mockPrismaUser]);
      expect(Array.isArray(result)).toBe(true);
      expect(result[0]).toBeInstanceOf(UserEntity);
      expect(result[0].id).toBe(mockPrismaUser.id);
    });
  });

  describe('update', () => {
    it('should update a UserEntity with data from UpdateUserDto', () => {
      const user = new UserEntity();
      user.name = 'Old Name';
      const dto: UpdateUserDto = { name: 'New Name' } as any;

      const result = UserFactory.update(user, dto);
      expect(result.name).toBe('New Name');
    });
  });
});
