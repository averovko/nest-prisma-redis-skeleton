import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MinLength } from 'class-validator';
import { ConfirmPasswordResetInput } from '../../application/dto/confirm-password-reset.input';

export class ConfirmPasswordResetDto implements ConfirmPasswordResetInput {
  @ApiProperty()
  @IsString()
  @IsNotEmpty()
  token: string;

  @ApiProperty({ minLength: 8 })
  @IsString()
  @MinLength(8)
  newPassword: string;
}
