import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';
import { VerifyEmailInput } from '../../application/dto/verify-email.input';

export class VerifyEmailDto implements VerifyEmailInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;
}
