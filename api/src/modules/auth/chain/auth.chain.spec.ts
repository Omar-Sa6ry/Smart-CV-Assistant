import { I18nService } from 'nestjs-i18n';
import { PasswordValidator, RoleValidator } from './auth.chain';
import { User } from 'src/modules/users/entity/user.entity';
import { Role } from 'src/common/constant/enum.constant';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';

describe('AuthChain (Validators)', () => {
  let mockI18n: I18nService;
  let mockPasswordService: any;
  let user: User;

  beforeEach(() => {
    mockI18n = { t: jest.fn().mockImplementation((key) => Promise.resolve(key)) } as any;
    mockPasswordService = { compare: jest.fn() };
    user = { password: 'hashedpassword', role: Role.USER } as User;
  });

  describe('PasswordValidator', () => {
    it('should call next validator if password is valid', async () => {
      mockPasswordService.compare.mockResolvedValue(true);
      const nextValidator = { validate: jest.fn() };
      const validator = new PasswordValidator(mockI18n, mockPasswordService, 'plainpassword');
      validator.setNext(nextValidator as any);

      await validator.validate(user);

      expect(mockPasswordService.compare).toHaveBeenCalledWith('plainpassword', user.password);
      expect(nextValidator.validate).toHaveBeenCalledWith(user, undefined);
    });

    it('should throw BadRequestException if password is invalid', async () => {
      mockPasswordService.compare.mockResolvedValue(false);
      const validator = new PasswordValidator(mockI18n, mockPasswordService, 'wrongpassword');

      await expect(validator.validate(user)).rejects.toThrow(BadRequestException);
    });
  });

  describe('RoleValidator', () => {
    it('should call next validator if role matches', async () => {
      user.role = Role.ADMIN;
      const nextValidator = { validate: jest.fn() };
      const validator = new RoleValidator(mockI18n, Role.ADMIN);
      validator.setNext(nextValidator as any);

      await validator.validate(user);

      expect(nextValidator.validate).toHaveBeenCalled();
    });

    it('should throw UnauthorizedException if role mismatch', async () => {
      user.role = Role.USER;
      const validator = new RoleValidator(mockI18n, Role.ADMIN);

      await expect(validator.validate(user)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('Chain Logic', () => {
    it('should execute full chain correctly', async () => {
      mockPasswordService.compare.mockResolvedValue(true);
      user.role = Role.ADMIN;

      const passValidator = new PasswordValidator(mockI18n, mockPasswordService, 'plainpassword');
      const roleValidator = new RoleValidator(mockI18n, Role.ADMIN);
      
      passValidator.setNext(roleValidator);

      await expect(passValidator.validate(user)).resolves.not.toThrow();
    });
  });
});
