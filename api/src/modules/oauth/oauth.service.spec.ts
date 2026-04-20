import { Test, TestingModule } from '@nestjs/testing';
import { OAuthService } from './oauth.service';
import { PrismaService } from 'src/common/database/prisma.service';
import { Role } from 'src/common/constant/enum.constant';
import { UserFactory } from 'src/modules/users/factory/user.factory';
import { GoogleUserData } from './interface/google.interface';

describe('OAuthService', () => {
  let service: OAuthService;
  let prisma: PrismaService;

  const mockPrisma = {
    user: {
      findFirst: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockGoogleUserData: GoogleUserData = {
    googleId: 'google-123',
    email: 'test@example.com',
    firstName: 'Test',
    lastName: 'User',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OAuthService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<OAuthService>(OAuthService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return existing user if they already have a googleId', async () => {
      const existingUser = { id: '1', email: 'test@example.com', googleId: 'google-123' };
      mockPrisma.user.findFirst.mockResolvedValue(existingUser);

      const result = await service.validateUser(mockGoogleUserData);

      expect(prisma.user.findFirst).toHaveBeenCalled();
      expect(result.id).toBe(existingUser.id);
      expect(prisma.user.update).not.toHaveBeenCalled();
    });

    it('should update and return user if they exist but lack a googleId', async () => {
      const userWithoutGoogleId = { id: '1', email: 'test@example.com', googleId: null };
      const updatedUser = { ...userWithoutGoogleId, googleId: 'google-123' };
      
      mockPrisma.user.findFirst.mockResolvedValue(userWithoutGoogleId);
      mockPrisma.user.update.mockResolvedValue(updatedUser);

      const result = await service.validateUser(mockGoogleUserData);

      expect(prisma.user.update).toHaveBeenCalledWith({
        where: { id: '1' },
        data: { googleId: 'google-123' },
      });
      expect(result.googleId).toBe('google-123');
    });

    it('should create a new ADMIN user if no users exist in database', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(0);
      mockPrisma.user.create.mockResolvedValue({ 
        ...mockGoogleUserData, 
        id: 'new-admin-id', 
        role: Role.ADMIN 
      });

      const result = await service.validateUser(mockGoogleUserData);

      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: Role.ADMIN })
      }));
      expect(result.role).toBe(Role.ADMIN);
    });

    it('should create a new USER if other users exist in database', async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.user.count.mockResolvedValue(10);
      mockPrisma.user.create.mockResolvedValue({ 
        ...mockGoogleUserData, 
        id: 'new-user-id', 
        role: Role.USER 
      });

      const result = await service.validateUser(mockGoogleUserData);

      expect(prisma.user.create).toHaveBeenCalledWith(expect.objectContaining({
        data: expect.objectContaining({ role: Role.USER })
      }));
      expect(result.role).toBe(Role.USER);
    });
  });
});
