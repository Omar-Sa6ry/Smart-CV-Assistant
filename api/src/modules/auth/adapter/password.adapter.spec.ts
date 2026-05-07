import { Test, TestingModule } from '@nestjs/testing';
import { PasswordServiceAdapter } from './password.adapter';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';

jest.mock('bcrypt');

describe('PasswordServiceAdapter', () => {
  let adapter: PasswordServiceAdapter;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PasswordServiceAdapter],
    }).compile();

    adapter = module.get<PasswordServiceAdapter>(PasswordServiceAdapter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('should correctly hash a password', async () => {
      const password = 'plain-password';
      const salt = 'salt';
      const hash = 'hashed-password';

      (bcrypt.genSalt as jest.Mock).mockResolvedValue(salt);
      (bcrypt.hash as jest.Mock).mockResolvedValue(hash);

      const result = await adapter.hash(password);

      expect(bcrypt.genSalt).toHaveBeenCalled();
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hash);
    });
  });

  describe('compare', () => {
    it('should return true if passwords match', async () => {
      const password = 'plain-password';
      const hash = 'hashed-password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(true);

      const result = await adapter.compare(password, hash);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hash);
      expect(result).toBe(true);
    });

    it('should throw BadRequestException if passwords do not match', async () => {
      const password = 'wrong-password';
      const hash = 'hashed-password';

      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(adapter.compare(password, hash)).rejects.toThrow(BadRequestException);
    });
  });
});
