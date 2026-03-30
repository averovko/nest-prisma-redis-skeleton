import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
  UseFilters,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import {
  GlobalErrorFilter,
  ErrorResponse,
  COMMON_PUBLIC_ERRORS,
} from 'src/common/errors';
import {
  AuthCtx,
  Role,
  AuthGuard,
  AuthContext,
  RolesGuard,
  RequireAnyRoles,
} from 'src/common/auth';
import { CreatedResponse, OkResponse } from 'src/common';
import { RegisterUseCase } from '../application/use-cases/register.use-case';
import { LoginUseCase } from '../application/use-cases/login.use-case';
import { RefreshTokenUseCase } from '../application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from '../application/use-cases/logout.use-case';
import { ChangePasswordUseCase } from '../application/use-cases/change-password.use-case';
import { InitiatePasswordResetUseCase } from '../application/use-cases/initiate-password-reset.use-case';
import { ConfirmPasswordResetUseCase } from '../application/use-cases/confirm-password-reset.use-case';
import { RegisterDto } from './dto/register.input.dto';
import { LoginDto } from './dto/login.input.dto';
import { RefreshTokenDto } from './dto/refresh-token.input.dto';
import { TokenPairDto } from './dto/token-pair.output.dto';
import { ChangePasswordDto } from './dto/change-password.input.dto';
import { InitiatePasswordResetDto } from './dto/initiate-password-reset.input.dto';
import { ConfirmPasswordResetDto } from './dto/confirm-password-reset.input.dto';
import {
  AUTHENTICATION_ERRORS,
  AuthenticationErrorCode,
} from '../domain/errors';

@Controller({ path: 'authentication', version: '1' })
@UseFilters(GlobalErrorFilter)
@ApiTags('authentication')
@ErrorResponse(COMMON_PUBLIC_ERRORS)
export class AuthenticationController {
  constructor(
    private readonly registerUseCase: RegisterUseCase,
    private readonly loginUseCase: LoginUseCase,
    private readonly refreshTokenUseCase: RefreshTokenUseCase,
    private readonly logoutUseCase: LogoutUseCase,
    private readonly changePasswordUseCase: ChangePasswordUseCase,
    private readonly initiatePasswordResetUseCase: InitiatePasswordResetUseCase,
    private readonly confirmPasswordResetUseCase: ConfirmPasswordResetUseCase,
  ) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new account' })
  @CreatedResponse(TokenPairDto)
  @ErrorResponse({
    EMAIL_ALREADY_TAKEN:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.EMAIL_ALREADY_TAKEN],
  })
  async register(@Body() body: RegisterDto): Promise<TokenPairDto> {
    const tokenPair = await this.registerUseCase.execute(body);
    return TokenPairDto.fromApplication(tokenPair);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login with email and password' })
  @OkResponse(TokenPairDto)
  @ErrorResponse({
    INVALID_CREDENTIALS:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.INVALID_CREDENTIALS],
  })
  async login(@Body() body: LoginDto): Promise<TokenPairDto> {
    const tokenPair = await this.loginUseCase.execute(body);
    return TokenPairDto.fromApplication(tokenPair);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token' })
  @OkResponse(TokenPairDto)
  @ErrorResponse({
    REFRESH_TOKEN_INVALID:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.REFRESH_TOKEN_INVALID],
    REFRESH_TOKEN_EXPIRED:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.REFRESH_TOKEN_EXPIRED],
  })
  async refresh(@Body() body: RefreshTokenDto): Promise<TokenPairDto> {
    const tokenPair = await this.refreshTokenUseCase.execute(body.refreshToken);
    return TokenPairDto.fromApplication(tokenPair);
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard, RolesGuard)
  @RequireAnyRoles(Role.ROOT, Role.ADMIN, Role.USER)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Logout and invalidate refresh tokens' })
  async logout(@AuthContext() authCtx: AuthCtx): Promise<void> {
    const person = authCtx.getPerson();
    await this.logoutUseCase.execute(person!.authId);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Change password for the logged-in user' })
  @ErrorResponse({
    CREDENTIALS_NOT_FOUND:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.CREDENTIALS_NOT_FOUND],
    INVALID_CURRENT_PASSWORD:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.INVALID_CURRENT_PASSWORD],
  })
  async changePassword(
    @Body() body: ChangePasswordDto,
    @AuthContext() authCtx: AuthCtx,
  ): Promise<void> {
    const person = authCtx.getPerson();
    const user = authCtx.getUser();
    await this.changePasswordUseCase.execute(person!.authId, user!.id, body);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary:
      'Initiate password reset — sends reset token via Notification service (email, etc.)',
  })
  async initiatePasswordReset(
    @Body() body: InitiatePasswordResetDto,
  ): Promise<void> {
    await this.initiatePasswordResetUseCase.execute(body);
  }

  @Post('reset-password/confirm')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Confirm password reset with token and set new password',
  })
  @ErrorResponse({
    RESET_TOKEN_INVALID:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.RESET_TOKEN_INVALID],
    RESET_TOKEN_EXPIRED:
      AUTHENTICATION_ERRORS[AuthenticationErrorCode.RESET_TOKEN_EXPIRED],
  })
  async confirmPasswordReset(
    @Body() body: ConfirmPasswordResetDto,
  ): Promise<void> {
    await this.confirmPasswordResetUseCase.execute(body);
  }
}
