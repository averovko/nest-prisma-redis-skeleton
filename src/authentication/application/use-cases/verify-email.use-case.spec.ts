import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { AppError } from 'src/common/errors';
import { CREDENTIALS_REPOSITORY } from '../../domain/ports/credentials.repository.port';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from '../../domain/ports/email-verification-token.repository.port';
import { AuthenticationErrorCode } from '../../domain/errors/authentication.error-codes';
import { mockCredentials } from '../../__fixtures__/auth.fixtures';
import { VerifyEmailUseCase } from './verify-email.use-case';

describe('VerifyEmailUseCase', () => {
  let useCase: VerifyEmailUseCase;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockEmailVerificationTokenRepo: jest.Mocked<any>;

  beforeEach(async () => {
    mockCredentialsRepo = {
      findById: jest.fn(),
      markAsVerified: jest.fn(),
    };
    mockEmailVerificationTokenRepo = {
      findByHash: jest.fn(),
      deleteById: jest.fn(),
      deleteAllByCredentialsId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        VerifyEmailUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        {
          provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
          useValue: mockEmailVerificationTokenRepo,
        },
      ],
    }).compile();

    useCase = module.get(VerifyEmailUseCase);
  });

  it('marks credentials as verified and clears tokens on valid token', async () => {
    const rawToken = 'valid-token';
    const expectedHash = createHash('sha256').update(rawToken).digest('hex');
    const tokenRow = {
      id: 'evt-1',
      credentialsId: 'cred-id-1',
      tokenHash: expectedHash,
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    };
    const credentials = mockCredentials({ id: 'cred-id-1', isVerified: false });
    mockEmailVerificationTokenRepo.findByHash.mockResolvedValue(tokenRow);
    mockCredentialsRepo.findById.mockResolvedValue(credentials);
    mockCredentialsRepo.markAsVerified.mockResolvedValue({
      ...credentials,
      isVerified: true,
    });

    const result = await useCase.execute({ token: rawToken });

    expect(mockEmailVerificationTokenRepo.findByHash).toHaveBeenCalledWith(
      expectedHash,
    );
    expect(mockCredentialsRepo.markAsVerified).toHaveBeenCalledWith(
      credentials.authId,
    );
    expect(
      mockEmailVerificationTokenRepo.deleteAllByCredentialsId,
    ).toHaveBeenCalledWith(credentials.id);
    expect(result).toEqual({ status: 'ok' });
  });

  it('returns idempotent success for unknown token', async () => {
    mockEmailVerificationTokenRepo.findByHash.mockResolvedValue(null);

    const result = await useCase.execute({ token: 'missing-token' });

    expect(result).toEqual({ status: 'ok' });
    expect(mockCredentialsRepo.findById).not.toHaveBeenCalled();
    expect(mockCredentialsRepo.markAsVerified).not.toHaveBeenCalled();
  });

  it('returns idempotent success and deletes token for expired token', async () => {
    const tokenRow = {
      id: 'evt-expired',
      credentialsId: 'cred-id-1',
      tokenHash: 'hash',
      expiresAt: new Date('2000-01-01'),
      createdAt: new Date(),
    };
    mockEmailVerificationTokenRepo.findByHash.mockResolvedValue(tokenRow);

    const result = await useCase.execute({ token: 'expired-token' });

    expect(mockEmailVerificationTokenRepo.deleteById).toHaveBeenCalledWith(
      tokenRow.id,
    );
    expect(result).toEqual({ status: 'ok' });
    expect(mockCredentialsRepo.findById).not.toHaveBeenCalled();
  });

  it('returns idempotent success when credentials already verified', async () => {
    const tokenRow = {
      id: 'evt-2',
      credentialsId: 'cred-id-1',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    };
    const credentials = mockCredentials({ id: 'cred-id-1', isVerified: true });
    mockEmailVerificationTokenRepo.findByHash.mockResolvedValue(tokenRow);
    mockCredentialsRepo.findById.mockResolvedValue(credentials);

    const result = await useCase.execute({ token: 'already-verified-token' });

    expect(mockCredentialsRepo.markAsVerified).not.toHaveBeenCalled();
    expect(
      mockEmailVerificationTokenRepo.deleteAllByCredentialsId,
    ).toHaveBeenCalledWith(credentials.id);
    expect(result).toEqual({ status: 'ok' });
  });

  it('throws CREDENTIALS_NOT_FOUND when token exists but credentials missing', async () => {
    const tokenRow = {
      id: 'evt-3',
      credentialsId: 'cred-missing',
      tokenHash: 'hash',
      expiresAt: new Date(Date.now() + 60_000),
      createdAt: new Date(),
    };
    mockEmailVerificationTokenRepo.findByHash.mockResolvedValue(tokenRow);
    mockCredentialsRepo.findById.mockResolvedValue(null);

    const executePromise = useCase.execute({ token: 'valid-token' });
    await expect(executePromise).rejects.toMatchObject({
      code: AuthenticationErrorCode.CREDENTIALS_NOT_FOUND,
    });
    await expect(executePromise).rejects.toBeInstanceOf(AppError);
  });
});
