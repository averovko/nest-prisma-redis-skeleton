import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AppConfigModule } from 'src/common/configuration/config.module';
import { CREDENTIALS_REPOSITORY } from './domain/ports/credentials.repository.port';
import { CredentialsRepository } from './infrastructure/repositories/credentials.repository';
import { REFRESH_TOKEN_REPOSITORY } from './domain/ports/refresh-token.repository.port';
import { RefreshTokenRepository } from './infrastructure/repositories/refresh-token.repository';
import { PASSWORD_RESET_TOKEN_REPOSITORY } from './domain/ports/password-reset-token.repository.port';
import { PasswordResetTokenRepository } from './infrastructure/repositories/password-reset-token.repository';
import { EMAIL_VERIFICATION_TOKEN_REPOSITORY } from './domain/ports/email-verification-token.repository.port';
import { EmailVerificationTokenRepository } from './infrastructure/repositories/email-verification-token.repository';
import { PASSWORD_HASHER_PORT } from './domain/ports/password-hasher.port';
import { BcryptPasswordHasher } from './infrastructure/services/bcrypt-password-hasher.service';
import { TOKEN_ISSUER_PORT } from './domain/ports/token-issuer.port';
import { JwtTokenIssuer } from './infrastructure/services/jwt-token-issuer.service';
import { RegisterUseCase } from './application/use-cases/register.use-case';
import { LoginUseCase } from './application/use-cases/login.use-case';
import { RefreshTokenUseCase } from './application/use-cases/refresh-token.use-case';
import { LogoutUseCase } from './application/use-cases/logout.use-case';
import { ChangePasswordUseCase } from './application/use-cases/change-password.use-case';
import { InitiatePasswordResetUseCase } from './application/use-cases/initiate-password-reset.use-case';
import { ConfirmPasswordResetUseCase } from './application/use-cases/confirm-password-reset.use-case';
import { VerifyEmailUseCase } from './application/use-cases/verify-email.use-case';
import { AuthenticationController } from './presentation/authentication.controller';

@Module({
  imports: [AppConfigModule, JwtModule],
  providers: [
    {
      provide: CREDENTIALS_REPOSITORY,
      useClass: CredentialsRepository
    },
    {
      provide: REFRESH_TOKEN_REPOSITORY,
      useClass: RefreshTokenRepository
    },
    {
      provide: PASSWORD_RESET_TOKEN_REPOSITORY,
      useClass: PasswordResetTokenRepository
    },
    {
      provide: EMAIL_VERIFICATION_TOKEN_REPOSITORY,
      useClass: EmailVerificationTokenRepository
    },
    {
      provide: PASSWORD_HASHER_PORT,
      useClass: BcryptPasswordHasher
    },
    {
      provide: TOKEN_ISSUER_PORT,
      useClass: JwtTokenIssuer
    },
    RegisterUseCase,
    LoginUseCase,
    RefreshTokenUseCase,
    LogoutUseCase,
    ChangePasswordUseCase,
    InitiatePasswordResetUseCase,
    ConfirmPasswordResetUseCase,
    VerifyEmailUseCase,
  ],
  controllers: [AuthenticationController],
})
export class AuthenticationModule { }
