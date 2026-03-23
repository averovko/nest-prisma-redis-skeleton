import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';
import { LoginInput } from '../../application/dto/login.input';

export class LoginDto implements LoginInput {
  @ApiProperty({ example: 'john.doe@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'StrongPass1!' })
  @IsString()
  @MinLength(8)
  password: string;
}
