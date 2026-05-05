import { ApiProperty } from '@nestjs/swagger';
import { VerifyEmailOutput } from '../../application/dto/verify-email.output';

export class VerifyEmailOutputDto implements VerifyEmailOutput {
  @ApiProperty({ example: 'ok' })
  status: 'ok';

  static fromApplication(output: VerifyEmailOutput): VerifyEmailOutputDto {
    return {
      status: output.status,
    };
  }
}
