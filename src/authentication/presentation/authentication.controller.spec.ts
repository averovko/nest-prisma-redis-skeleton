import { Test, TestingModule } from '@nestjs/testing';
import { AuthCtx, AuthGuard, User } from 'src/common/auth';
import { TokenPairDto } from './dto/token-pair.output.dto';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { InitiatePasswordResetUseCase } from '../application/use-cases/initiate-password-reset.use-case';
import { ConfirmPasswordResetUseCase } from '../application/use-cases/confirm-password-reset.use-case';
import { VerifyEmailUseCase } from '../application/use-cases/verify-email.use-case';
import { mockTokenPair } from '../__fixtures__/auth.fixtures';
import { AuthenticationController } from './authentication.controller';

describe('AuthenticationController', () => {
  let controller: AuthenticationController;
  let mockRegisterUseCase: jest.Mocked<RegisterUseCase>;
  let mockLoginUseCase: jest.Mocked<LoginUseCase>;
  let mockRefreshTokenUseCase: jest.Mocked<RefreshTokenUseCase>;
  let mockLogoutUseCase: jest.Mocked<LogoutUseCase>;
  let mockChangePasswordUseCase: jest.Mocked<ChangePasswordUseCase>;
  let mockInitiatePasswordResetUseCase: jest.Mocked<InitiatePasswordResetUseCase>;
  let mockConfirmPasswordResetUseCase: jest.Mocked<ConfirmPasswordResetUseCase>;
  let mockVerifyEmailUseCase: jest.Mocked<VerifyEmailUseCase>;

  const buildMockAuthCtx = (authId = 'auth-id-1'): AuthCtx =>
    AuthCtx.forPerson({ authId }, {
      id: 'user-id-1',
      authId,
    } as unknown as User);

  beforeEach(async () => {
    mockRegisterUseCase = { execute: jest.fn() } as any;
    mockLoginUseCase = { execute: jest.fn() } as any;
    mockRefreshTokenUseCase = { execute: jest.fn() } as any;
    mockLogoutUseCase = { execute: jest.fn() } as any;
    mockChangePasswordUseCase = { execute: jest.fn() } as any;
    mockInitiatePasswordResetUseCase = { execute: jest.fn() } as any;
    mockConfirmPasswordResetUseCase = { execute: jest.fn() } as any;
    mockVerifyEmailUseCase = { execute: jest.fn() } as any;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthenticationController],
      providers: [
        { provide: RegisterUseCase, useValue: mockRegisterUseCase },
        { provide: LoginUseCase, useValue: mockLoginUseCase },
        { provide: RefreshTokenUseCase, useValue: mockRefreshTokenUseCase },
        { provide: LogoutUseCase, useValue: mockLogoutUseCase },
        { provide: ChangePasswordUseCase, useValue: mockChangePasswordUseCase },
        {
          provide: InitiatePasswordResetUseCase,
          useValue: mockInitiatePasswordResetUseCase,
        },
        {
          provide: ConfirmPasswordResetUseCase,
          useValue: mockConfirmPasswordResetUseCase,
        },
        { provide: VerifyEmailUseCase, useValue: mockVerifyEmailUseCase },
      ],
    })
      .overrideGuard(AuthGuard)
      .useValue({ canActivate: () => true })
      .compile();

    controller = module.get(AuthenticationController);
  });

  describe('register', () => {
    it('executes RegisterUseCase and returns a TokenPairDto', async () => {
      mockRegisterUseCase.execute.mockResolvedValue(mockTokenPair());
      const inputBody = {
        email: 'a@a.com',
        password: 'pass12345',
        firstName: 'John',
      };
      const requestContext = { ipAddress: '1.2.3.4', userAgent: 'UA' };

      const actualResult = await controller.register(inputBody, requestContext);

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(
        inputBody,
        requestContext,
      );
      expect(actualResult).toBeInstanceOf(TokenPairDto);
      expect(actualResult.accessToken).toBe('access.jwt.token');
      expect(actualResult.refreshToken).toBe('refresh.jwt.token');
    });
  });

  describe('login', () => {
    it('executes LoginUseCase and returns a TokenPairDto', async () => {
      mockLoginUseCase.execute.mockResolvedValue(mockTokenPair());
      const inputBody = { email: 'a@a.com', password: 'pass12345' };
      const requestContext = { ipAddress: '1.2.3.4' };

      const actualResult = await controller.login(inputBody, requestContext);

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(
        inputBody,
        requestContext,
      );
      expect(actualResult).toBeInstanceOf(TokenPairDto);
    });
  });

  describe('refresh', () => {
    it('executes RefreshTokenUseCase with the raw refresh token and returns a TokenPairDto', async () => {
      mockRefreshTokenUseCase.execute.mockResolvedValue(mockTokenPair());

      const actualResult = await controller.refresh({
        refreshToken: 'raw.refresh.token',
      });

      expect(mockRefreshTokenUseCase.execute).toHaveBeenCalledWith(
        'raw.refresh.token',
      );
      expect(actualResult).toBeInstanceOf(TokenPairDto);
    });
  });

  describe('logout', () => {
    it('executes LogoutUseCase with the authId and requestContext from auth context', async () => {
      mockLogoutUseCase.execute.mockResolvedValue(undefined);
      const requestContext = { ipAddress: '10.0.0.1', userAgent: 'UA' };
      const inputAuthCtx =
        buildMockAuthCtx('auth-id-1').withRequestContext(requestContext);

      await controller.logout(inputAuthCtx);

      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith(
        'auth-id-1',
        requestContext,
      );
    });
  });

  describe('changePassword', () => {
    it('executes ChangePasswordUseCase with authId, body, and requestContext from auth context', async () => {
      mockChangePasswordUseCase.execute.mockResolvedValue(undefined);
      const inputBody = {
        currentPassword: 'old12345',
        newPassword: 'new12345',
      };
      const requestContext = { ipAddress: '10.0.0.1' };
      const inputAuthCtx =
        buildMockAuthCtx('auth-id-1').withRequestContext(requestContext);

      await controller.changePassword(inputBody, inputAuthCtx);

      expect(mockChangePasswordUseCase.execute).toHaveBeenCalledWith(
        'auth-id-1',
        inputBody,
        requestContext,
      );
    });
  });

  describe('initiatePasswordReset', () => {
    it('executes InitiatePasswordResetUseCase with the request body and requestContext', async () => {
      mockInitiatePasswordResetUseCase.execute.mockResolvedValue(undefined);
      const inputBody = { email: 'a@a.com' };
      const requestContext = { ipAddress: '1.2.3.4' };

      await controller.initiatePasswordReset(inputBody, requestContext);

      expect(mockInitiatePasswordResetUseCase.execute).toHaveBeenCalledWith(
        inputBody,
        requestContext,
      );
    });
  });

  describe('confirmPasswordReset', () => {
    it('executes ConfirmPasswordResetUseCase with the request body and requestContext', async () => {
      mockConfirmPasswordResetUseCase.execute.mockResolvedValue(undefined);
      const inputBody = { token: 'reset-token', newPassword: 'new12345' };
      const requestContext = {
        ipAddress: '5.6.7.8',
        device: 'Desktop',
        client: 'Chrome',
        os: 'Linux',
      };

      await controller.confirmPasswordReset(inputBody, requestContext);

      expect(mockConfirmPasswordResetUseCase.execute).toHaveBeenCalledWith(
        inputBody,
        requestContext,
      );
    });
  });

  describe('verifyEmail', () => {
    it('executes VerifyEmailUseCase with the request body and returns output dto', async () => {
      const inputBody = { token: 'verification-token' };
      mockVerifyEmailUseCase.execute.mockResolvedValue({ status: 'ok' });

      const actualResult = await controller.verifyEmail(inputBody);

      expect(mockVerifyEmailUseCase.execute).toHaveBeenCalledWith(inputBody);
      expect(actualResult).toEqual({ status: 'ok' });
    });
  });
});
