import { Test, TestingModule } from '@nestjs/testing';
import { RoleGuard } from './role.guard';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { I18nService } from 'nestjs-i18n';
import { PrismaService } from '../database/prisma.service';
import { ExecutionContext, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { Role, Permission } from '../constant/enum.constant';

describe('RoleGuard', () => {
  let guard: RoleGuard;
  let reflector: Reflector;
  let jwtService: JwtService;
  let prismaService: PrismaService;
  let i18nService: I18nService;

  const mockI18n = {
    t: jest.fn().mockImplementation((key) => Promise.resolve(key)),
  };

  const mockJwtService = {
    verifyAsync: jest.fn(),
  };

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  const mockPrismaService = {
    user: {
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RoleGuard,
        { provide: Reflector, useValue: mockReflector },
        { provide: JwtService, useValue: mockJwtService },
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: I18nService, useValue: mockI18n },
      ],
    }).compile();

    guard = module.get<RoleGuard>(RoleGuard);
    reflector = module.get<Reflector>(Reflector);
    jwtService = module.get<JwtService>(JwtService);
    prismaService = module.get<PrismaService>(PrismaService);
    i18nService = module.get<I18nService>(I18nService);
  });

  const createMockExecutionContext = (authHeader?: string): Partial<ExecutionContext> => {
    const mockRequest = {
      headers: {
        authorization: authHeader,
      },
    } as any;

    const mockGqlContext = {
      getContext: jest.fn().mockReturnValue({ request: mockRequest }),
    };

    jest.spyOn(GqlExecutionContext, 'create').mockReturnValue(mockGqlContext as any);

    return {
      getHandler: jest.fn(),
      getClass: jest.fn(),
    };
  };

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should throw UnauthorizedException if no token is provided', async () => {
      const context = createMockExecutionContext();
      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockI18n.t).toHaveBeenCalledWith('user.NO_TOKEN');
    });

    it('should throw UnauthorizedException if token is invalid', async () => {
      const context = createMockExecutionContext('Bearer invalid-token');
      mockJwtService.verifyAsync.mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockI18n.t).toHaveBeenCalledWith('user.INVALID_TOKEN');
    });

    it('should throw NotFoundException if user is not found in database', async () => {
      const context = createMockExecutionContext('Bearer valid-token');
      mockJwtService.verifyAsync.mockResolvedValue({ id: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw UnauthorizedException if user role is not allowed', async () => {
      const context = createMockExecutionContext('Bearer valid-token');
      const mockUser = { id: 'user-id', role: Role.USER, email: 'test@test.com' };
      
      mockJwtService.verifyAsync.mockResolvedValue({ id: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockReflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'roles') return [Role.ADMIN];
        return [];
      });

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
      expect(mockI18n.t).toHaveBeenCalledWith('user.INSUFFICIENT_PERMISSIONS');
    });

    it('should throw UnauthorizedException if user lacks required permissions', async () => {
      const context = createMockExecutionContext('Bearer valid-token');
      const mockUser = { id: 'user-id', role: Role.USER, email: 'test@test.com' };
      
      mockJwtService.verifyAsync.mockResolvedValue({ id: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockReflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'roles') return [];
        if (key === 'permissions') return [Permission.EDIT_USER_ROLE]; // USER doesn't have this
        return [];
      });

      await expect(guard.canActivate(context as ExecutionContext)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should allow access and populate request user if roles and permissions match', async () => {
      const context = createMockExecutionContext('Bearer valid-token');
      const mockUser = { id: 'user-id', role: Role.ADMIN, email: 'admin@test.com' };
      
      mockJwtService.verifyAsync.mockResolvedValue({ id: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockReflector.getAllAndOverride.mockImplementation((key) => {
        if (key === 'roles') return [Role.ADMIN];
        if (key === 'permissions') return [Permission.EDIT_USER_ROLE];
        return [];
      });

      const result = await guard.canActivate(context as ExecutionContext);
      
      expect(result).toBe(true);
      const req = GqlExecutionContext.create(context as ExecutionContext).getContext().request;
      expect(req.user).toBeDefined();
      expect(req.user.id).toBe(mockUser.id);
      expect(req.user.role).toBe(Role.ADMIN);
    });

    it('should allow access if no roles or permissions are required', async () => {
      const context = createMockExecutionContext('Bearer valid-token');
      const mockUser = { id: 'user-id', role: Role.USER, email: 'test@test.com' };
      
      mockJwtService.verifyAsync.mockResolvedValue({ id: 'user-id' });
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockReflector.getAllAndOverride.mockReturnValue([]);

      const result = await guard.canActivate(context as ExecutionContext);
      expect(result).toBe(true);
    });
  });
});
