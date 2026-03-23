import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { BcryptPasswordHasher } from './bcrypt-password-hasher.service';

jest.mock('bcrypt');

describe('BcryptPasswordHasher', () => {
  let service: BcryptPasswordHasher;
  let mockConfigService: jest.Mocked<ConfigService>;
  const mockedBcrypt = jest.mocked(bcrypt);

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue(10),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BcryptPasswordHasher,
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(BcryptPasswordHasher);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('hash', () => {
    it('calls bcrypt.hash with the plain password and configured salt rounds', async () => {
      mockedBcrypt.hash.mockResolvedValue('$2b$10$hashedpassword' as never);

      const actualHash = await service.hash('plainPassword');

      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plainPassword', 10);
      expect(actualHash).toBe('$2b$10$hashedpassword');
    });

    it('reads salt rounds from config with the correct key', async () => {
      mockedBcrypt.hash.mockResolvedValue('$2b$12$hashedpassword' as never);
      mockConfigService.get.mockReturnValue(12);

      await service.hash('plainPassword');

      expect(mockConfigService.get).toHaveBeenCalledWith('security.bcryptSaltRounds');
      expect(mockedBcrypt.hash).toHaveBeenCalledWith('plainPassword', 12);
    });
  });

  describe('compare', () => {
    it('returns true when the plain password matches the hash', async () => {
      mockedBcrypt.compare.mockResolvedValue(true as never);

      const actualResult = await service.compare('plainPassword', '$2b$10$hashedpassword');

      expect(mockedBcrypt.compare).toHaveBeenCalledWith('plainPassword', '$2b$10$hashedpassword');
      expect(actualResult).toBe(true);
    });

    it('returns false when the plain password does not match the hash', async () => {
      mockedBcrypt.compare.mockResolvedValue(false as never);

      const actualResult = await service.compare('wrongPassword', '$2b$10$hashedpassword');

      expect(actualResult).toBe(false);
    });
  });
});
