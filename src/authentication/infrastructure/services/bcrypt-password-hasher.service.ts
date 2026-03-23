import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PasswordHasherPort } from '../../domain/ports/password-hasher.port';

@Injectable()
export class BcryptPasswordHasher implements PasswordHasherPort {
  constructor(private readonly configService: ConfigService) {}

  async hash(plainPassword: string): Promise<string> {
    const saltRounds = this.configService.get<number>(
      'security.bcryptSaltRounds',
    );
    return bcrypt.hash(plainPassword, saltRounds);
  }

  async compare(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
  }
}
