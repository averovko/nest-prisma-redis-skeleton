import { INestApplication, ValidationPipe, VersioningType } from '@nestjs/common';
import { CanActivate, ExecutionContext } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { JwtModule } from '@nestjs/jwt';
import request from 'supertest';
import { createHash } from 'crypto';
import { AppConfigModule } from '../src/common/configuration/config.module';
import { GlobalErrorFilter } from '../src/common/errors';
import { AuthGuard, AuthCtx } from '../src/common/auth';
import { EVENT_BUS_TOKEN } from '../src/common/event-manager/entities/tokens';
import { CREDENTIALS_REPOSITORY } from '../src/authentication/domain/ports/credentials.repository.port';
import { REFRESH_TOKEN_REPOSITORY } from '../src/authentication/domain/ports/refresh-token.repository.port';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from '../src/authentication/domain/ports/password-reset-token.repository.port';
import { PASSWORD_HASHER_PORT } from '../src/authentication/domain/ports/password-hasher.port';
import { TOKEN_ISSUER_PORT } from '../src/authentication/domain/ports/token-issuer.port';
import { RegisterUseCase } from '../src/authentication/application/use-cases/register.use-case';
import { LoginUseCase } from '../src/authentication/application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../src/authentication/application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../src/authentication/application/use-cases/logout.use-case';
import { ChangePasswordUseCase } from '../src/authentication/application/use-cases/change-password.use-case';
import { InitiatePasswordResetUseCase } from '../src/authentication/application/use-cases/initiate-password-reset.use-case';
import { ConfirmPasswordResetUseCase } from '../src/authentication/application/use-cases/confirm-password-reset.use-case';
import { AuthenticationController } from '../src/authentication/presentation/authentication.controller';
import { AuthenticationErrorCode } from '../src/authentication/domain/errors/authentication.error-codes';

const TEST_AUTH_ID = 'e2e-auth-id-1';
const TEST_CREDENTIALS_ID = 'e2e-cred-id-1';
const TEST_EMAIL = 'e2e@example.com';

class MockAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const authCtx = new AuthCtx();
    jest.spyOn(authCtx, 'getPerson').mockReturnValue({ authId: TEST_AUTH_ID });
    req.authCtx = authCtx;
    return true;
  }
}

const buildMockCredentials = (overrides: Record<string, unknown> = {}) => ({
  id: TEST_CREDENTIALS_ID,
  authId: TEST_AUTH_ID,
  email: TEST_EMAIL,
  passwordHash: '$2b$10$hashedpassword',
  isVerified: false,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  ...overrides,
});

const buildMockTokenEntry = (overrides: Record<string, unknown> = {}) => ({
  id: 'e2e-rt-id-1',
  credentialsId: TEST_CREDENTIALS_ID,
  tokenHash: 'somehash',
  expiresAt: new Date(Date.now() + 86_400_000),
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

const buildMockResetToken = (overrides: Record<string, unknown> = {}) => ({
  id: 'e2e-prt-id-1',
  credentialsId: TEST_CREDENTIALS_ID,
  tokenHash: 'resethash',
  expiresAt: new Date(Date.now() + 3_600_000),
  createdAt: new Date('2024-01-01'),
  ...overrides,
});

describe('AuthenticationController (e2e)', () => {
  let app: INestApplication;
  let mockCredentialsRepo: jest.Mocked<any>;
  let mockRefreshTokenRepo: jest.Mocked<any>;
  let mockPasswordResetTokenRepo: jest.Mocked<any>;
  let mockPasswordHasher: jest.Mocked<any>;
  let mockTokenIssuer: jest.Mocked<any>;
  let mockEventBus: jest.Mocked<any>;

  beforeAll(async () => {
    mockCredentialsRepo = {
      create: jest.fn(),
      findById: jest.fn(),
      findByEmail: jest.fn(),
      findByAuthId: jest.fn(),
      existsByEmail: jest.fn(),
      updatePasswordHash: jest.fn(),
    };
    mockRefreshTokenRepo = {
      create: jest.fn(),
      findByHash: jest.fn(),
      deleteById: jest.fn(),
      deleteAllByCredentialsId: jest.fn(),
    };
    mockPasswordResetTokenRepo = {
      create: jest.fn(),
      findByHash: jest.fn(),
      deleteById: jest.fn(),
      deleteAllByCredentialsId: jest.fn(),
    };
    mockPasswordHasher = {
      hash: jest.fn().mockResolvedValue('$2b$10$hashedpassword'),
      compare: jest.fn(),
    };
    mockTokenIssuer = {
      issueTokenPair: jest.fn().mockReturnValue({
        accessToken: 'e2e.access.token',
        refreshToken: 'e2e.refresh.token',
      }),
    };
    mockEventBus = { publish: jest.fn().mockResolvedValue(undefined) };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppConfigModule, JwtModule.register({})],
      controllers: [AuthenticationController],
      providers: [
        RegisterUseCase,
        LoginUseCase,
        RefreshTokenUseCase,
        LogoutUseCase,
        ChangePasswordUseCase,
        InitiatePasswordResetUseCase,
        ConfirmPasswordResetUseCase,
        { provide: CREDENTIALS_REPOSITORY, useValue: mockCredentialsRepo },
        { provide: REFRESH_TOKEN_REPOSITORY, useValue: mockRefreshTokenRepo },
        { provide: PASSWORD_RESET_TOKEN_REPOSITORY, useValue: mockPasswordResetTokenRepo },
        { provide: PASSWORD_HASHER_PORT, useValue: mockPasswordHasher },
        { provide: TOKEN_ISSUER_PORT, useValue: mockTokenIssuer },
        { provide: EVENT_BUS_TOKEN, useValue: mockEventBus },
      ],
    })
      .overrideGuard(AuthGuard)
      .useClass(MockAuthGuard)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    app.useGlobalFilters(new GlobalErrorFilter());
    app.enableVersioning({ type: VersioningType.URI });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    mockPasswordHasher.hash.mockResolvedValue('$2b$10$hashedpassword');
    mockTokenIssuer.issueTokenPair.mockReturnValue({
      accessToken: 'e2e.access.token',
      refreshToken: 'e2e.refresh.token',
    });
    mockEventBus.publish.mockResolvedValue(undefined);
    mockRefreshTokenRepo.create.mockResolvedValue(buildMockTokenEntry());
    mockPasswordResetTokenRepo.deleteAllByCredentialsId.mockResolvedValue(undefined);
    mockPasswordResetTokenRepo.create.mockResolvedValue(buildMockResetToken());
    mockRefreshTokenRepo.deleteAllByCredentialsId.mockResolvedValue(undefined);
  });

  describe('POST /v1/authentication/register', () => {
    it('returns 201 with token pair on valid input', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(false);
      mockCredentialsRepo.create.mockResolvedValue(buildMockCredentials());

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/register')
        .send({ email: 'new@example.com', password: 'StrongPass1!', firstName: 'John' });

      expect(response.status).toBe(201);
      expect(response.body).toMatchObject({
        accessToken: 'e2e.access.token',
        refreshToken: 'e2e.refresh.token',
      });
    });

    it('returns 409 EMAIL_ALREADY_TAKEN when email is already registered', async () => {
      mockCredentialsRepo.existsByEmail.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/register')
        .send({ email: 'existing@example.com', password: 'StrongPass1!', firstName: 'John' });

      expect(response.status).toBe(409);
      expect(response.body.code).toBe(AuthenticationErrorCode.EMAIL_ALREADY_TAKEN);
    });

    it('returns 400 on invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/register')
        .send({ email: 'not-an-email', password: 'StrongPass1!', firstName: 'John' });

      expect(response.status).toBe(400);
    });

    it('returns 400 when password is shorter than 8 characters', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/register')
        .send({ email: 'new@example.com', password: 'short', firstName: 'John' });

      expect(response.status).toBe(400);
    });

    it('returns 400 when firstName is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/register')
        .send({ email: 'new@example.com', password: 'StrongPass1!' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/authentication/login', () => {
    it('returns 200 with token pair on valid credentials', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(buildMockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(true);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/login')
        .send({ email: TEST_EMAIL, password: 'StrongPass1!' });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        accessToken: 'e2e.access.token',
        refreshToken: 'e2e.refresh.token',
      });
    });

    it('returns 401 INVALID_CREDENTIALS when email is not registered', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/login')
        .send({ email: 'unknown@example.com', password: 'StrongPass1!' });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(AuthenticationErrorCode.INVALID_CREDENTIALS);
    });

    it('returns 401 INVALID_CREDENTIALS when password is wrong', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(buildMockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/login')
        .send({ email: TEST_EMAIL, password: 'WrongPass1!' });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(AuthenticationErrorCode.INVALID_CREDENTIALS);
    });

    it('returns 400 when email field is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/login')
        .send({ password: 'StrongPass1!' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/authentication/refresh', () => {
    it('returns 200 with new token pair on a valid refresh token', async () => {
      const inputRawToken = 'valid-raw-refresh-token';
      const expectedHash = createHash('sha256').update(inputRawToken).digest('hex');
      mockRefreshTokenRepo.findByHash.mockResolvedValue(buildMockTokenEntry({ tokenHash: expectedHash }));
      mockCredentialsRepo.findById.mockResolvedValue(buildMockCredentials());
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/refresh')
        .send({ refreshToken: inputRawToken });

      expect(response.status).toBe(200);
      expect(response.body).toMatchObject({
        accessToken: 'e2e.access.token',
        refreshToken: 'e2e.refresh.token',
      });
    });

    it('returns 401 REFRESH_TOKEN_INVALID for an unknown token', async () => {
      mockRefreshTokenRepo.findByHash.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/refresh')
        .send({ refreshToken: 'unknown-refresh-token' });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(AuthenticationErrorCode.REFRESH_TOKEN_INVALID);
    });

    it('returns 401 REFRESH_TOKEN_EXPIRED for an expired token', async () => {
      const inputRawToken = 'expired-raw-token';
      const expectedHash = createHash('sha256').update(inputRawToken).digest('hex');
      mockRefreshTokenRepo.findByHash.mockResolvedValue(
        buildMockTokenEntry({ tokenHash: expectedHash, expiresAt: new Date('2000-01-01') }),
      );
      mockRefreshTokenRepo.deleteById.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/refresh')
        .send({ refreshToken: inputRawToken });

      expect(response.status).toBe(401);
      expect(response.body.code).toBe(AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED);
    });

    it('returns 400 when refreshToken field is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/refresh')
        .send({});

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/authentication/logout', () => {
    it('returns 204 for an authenticated user', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(buildMockCredentials());

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/logout')
        .set('Authorization', 'Bearer test.token');

      expect(response.status).toBe(204);
    });

    it('returns 404 CREDENTIALS_NOT_FOUND when credentials are missing', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/logout')
        .set('Authorization', 'Bearer test.token');

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(AuthenticationErrorCode.CREDENTIALS_NOT_FOUND);
    });
  });

  describe('PATCH /v1/authentication/password', () => {
    it('returns 204 on successful password change', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(buildMockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(true);
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(buildMockCredentials());

      const response = await request(app.getHttpServer())
        .patch('/v1/authentication/password')
        .set('Authorization', 'Bearer test.token')
        .send({ currentPassword: 'OldPass1!', newPassword: 'NewPass2@' });

      expect(response.status).toBe(204);
    });

    it('returns 422 INVALID_CURRENT_PASSWORD when current password is wrong', async () => {
      mockCredentialsRepo.findByAuthId.mockResolvedValue(buildMockCredentials());
      mockPasswordHasher.compare.mockResolvedValue(false);

      const response = await request(app.getHttpServer())
        .patch('/v1/authentication/password')
        .set('Authorization', 'Bearer test.token')
        .send({ currentPassword: 'WrongPass!', newPassword: 'NewPass2@' });

      expect(response.status).toBe(422);
      expect(response.body.code).toBe(AuthenticationErrorCode.INVALID_CURRENT_PASSWORD);
    });

    it('returns 400 when newPassword is too short', async () => {
      const response = await request(app.getHttpServer())
        .patch('/v1/authentication/password')
        .set('Authorization', 'Bearer test.token')
        .send({ currentPassword: 'OldPass1!', newPassword: 'short' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/authentication/reset-password', () => {
    it('returns 204 for a registered email', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(buildMockCredentials());

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password')
        .send({ email: TEST_EMAIL });

      expect(response.status).toBe(204);
    });

    it('returns 204 silently for an unknown email (anti-enumeration)', async () => {
      mockCredentialsRepo.findByEmail.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password')
        .send({ email: 'unknown@example.com' });

      expect(response.status).toBe(204);
    });

    it('returns 400 on invalid email format', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password')
        .send({ email: 'not-an-email' });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/authentication/reset-password/confirm', () => {
    it('returns 204 on a valid non-expired reset token', async () => {
      const inputRawToken = 'valid-reset-token';
      const expectedHash = createHash('sha256').update(inputRawToken).digest('hex');
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        buildMockResetToken({ tokenHash: expectedHash }),
      );
      mockCredentialsRepo.findById.mockResolvedValue(buildMockCredentials());
      mockCredentialsRepo.updatePasswordHash.mockResolvedValue(buildMockCredentials());
      mockPasswordResetTokenRepo.deleteById.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password/confirm')
        .send({ token: inputRawToken, newPassword: 'NewStrongPass99!' });

      expect(response.status).toBe(204);
    });

    it('returns 404 RESET_TOKEN_INVALID for an unknown token', async () => {
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(null);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password/confirm')
        .send({ token: 'unknown-token', newPassword: 'NewStrongPass99!' });

      expect(response.status).toBe(404);
      expect(response.body.code).toBe(AuthenticationErrorCode.RESET_TOKEN_INVALID);
    });

    it('returns 410 RESET_TOKEN_EXPIRED for an expired reset token', async () => {
      const inputRawToken = 'expired-reset-token';
      const expectedHash = createHash('sha256').update(inputRawToken).digest('hex');
      mockPasswordResetTokenRepo.findByHash.mockResolvedValue(
        buildMockResetToken({ tokenHash: expectedHash, expiresAt: new Date('2000-01-01') }),
      );
      mockPasswordResetTokenRepo.deleteById.mockResolvedValue(undefined);

      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password/confirm')
        .send({ token: inputRawToken, newPassword: 'NewStrongPass99!' });

      expect(response.status).toBe(410);
      expect(response.body.code).toBe(AuthenticationErrorCode.RESET_TOKEN_EXPIRED);
    });

    it('returns 400 when newPassword is too short', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password/confirm')
        .send({ token: 'some-token', newPassword: 'short' });

      expect(response.status).toBe(400);
    });

    it('returns 400 when token field is missing', async () => {
      const response = await request(app.getHttpServer())
        .post('/v1/authentication/reset-password/confirm')
        .send({ newPassword: 'NewStrongPass99!' });

      expect(response.status).toBe(400);
    });
  });
});
