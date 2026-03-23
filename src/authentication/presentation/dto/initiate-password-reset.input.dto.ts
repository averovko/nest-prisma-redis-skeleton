import { ApiProperty } from '@nestjs/swagger';
import { IsEmail } from 'class-validator';
import { InitiatePasswordResetInput } from '../../application/dto/initiate-password-reset.input';

export class InitiatePasswordResetDto implements InitiatePasswordResetInput {
  @ApiProperty({ example: 'user@example.com' })
  @IsEmail()
  email: string;
}
