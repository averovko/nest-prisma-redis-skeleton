import { Test, TestingModule } from '@nestjs/testing';
import { AuthCtx, AuthGuard } from 'src/common/auth';
import { TokenPairDto } from './dto/token-pair.output.dto';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { InitiatePasswordResetUseCase } from '../application/use-cases/initiate-password-reset.use-case';
import { ConfirmPasswordResetUseCase } from '../application/use-cases/confirm-password-reset.use-case';
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

  const buildMockAuthCtx = (authId = 'auth-id-1'): AuthCtx =>
    AuthCtx.forPerson({ authId }, undefined);

  beforeEach(async () => {
    mockRegisterUseCase = { execute: jest.fn() } as any;
    mockLoginUseCase = { execute: jest.fn() } as any;
    mockRefreshTokenUseCase = { execute: jest.fn() } as any;
    mockLogoutUseCase = { execute: jest.fn() } as any;
    mockChangePasswordUseCase = { execute: jest.fn() } as any;
    mockInitiatePasswordResetUseCase = { execute: jest.fn() } as any;
    mockConfirmPasswordResetUseCase = { execute: jest.fn() } as any;

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

      const actualResult = await controller.register(inputBody);

      expect(mockRegisterUseCase.execute).toHaveBeenCalledWith(inputBody);
      expect(actualResult).toBeInstanceOf(TokenPairDto);
      expect(actualResult.accessToken).toBe('access.jwt.token');
      expect(actualResult.refreshToken).toBe('refresh.jwt.token');
    });
  });

  describe('login', () => {
    it('executes LoginUseCase and returns a TokenPairDto', async () => {
      mockLoginUseCase.execute.mockResolvedValue(mockTokenPair());
      const inputBody = { email: 'a@a.com', password: 'pass12345' };

      const actualResult = await controller.login(inputBody);

      expect(mockLoginUseCase.execute).toHaveBeenCalledWith(inputBody);
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
    it('executes LogoutUseCase with the authId extracted from the auth context', async () => {
      mockLogoutUseCase.execute.mockResolvedValue(undefined);
      const inputAuthCtx = buildMockAuthCtx('auth-id-1');

      await controller.logout(inputAuthCtx);

      expect(mockLogoutUseCase.execute).toHaveBeenCalledWith('auth-id-1');
    });
  });

  describe('changePassword', () => {
    it('executes ChangePasswordUseCase with authId from auth context and request body', async () => {
      mockChangePasswordUseCase.execute.mockResolvedValue(undefined);
      const inputBody = {
        currentPassword: 'old12345',
        newPassword: 'new12345',
      };
      const inputAuthCtx = buildMockAuthCtx('auth-id-1');

      await controller.changePassword(inputBody, inputAuthCtx);

      expect(mockChangePasswordUseCase.execute).toHaveBeenCalledWith(
        'auth-id-1',
        inputBody,
      );
    });
  });

  describe('initiatePasswordReset', () => {
    it('executes InitiatePasswordResetUseCase with the request body', async () => {
      mockInitiatePasswordResetUseCase.execute.mockResolvedValue(undefined);
      const inputBody = { email: 'a@a.com' };

      await controller.initiatePasswordReset(inputBody);

      expect(mockInitiatePasswordResetUseCase.execute).toHaveBeenCalledWith(
        inputBody,
      );
    });
  });

  describe('confirmPasswordReset', () => {
    it('executes ConfirmPasswordResetUseCase with the request body', async () => {
      mockConfirmPasswordResetUseCase.execute.mockResolvedValue(undefined);
      const inputBody = { token: 'reset-token', newPassword: 'new12345' };

      await controller.confirmPasswordReset(inputBody);

      expect(mockConfirmPasswordResetUseCase.execute).toHaveBeenCalledWith(
        inputBody,
      );
    });
  });
});
