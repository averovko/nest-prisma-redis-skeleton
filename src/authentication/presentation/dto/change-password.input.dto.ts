import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';
import { type ChangePasswordInput } from '../../application/dto/change-password.input';

export class ChangePasswordDto implements ChangePasswordInput {
  @ApiProperty({ example: 'CurrentPass1!' })
  @IsString()
  @MinLength(8)
  readonly currentPassword: string;

  @ApiProperty({ example: 'NewStrongPass2@' })
  @IsString()
  @MinLength(8)
  readonly newPassword: string;
}
