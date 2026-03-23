import { ApiProperty } from '@nestjs/swagger';
import { TokenPairOutput } from '../../application/dto/token-pair.output';

export class TokenPairDto implements TokenPairOutput {
  @ApiProperty()
  accessToken: string;

  @ApiProperty()
  refreshToken: string;

  static fromApplication(output: TokenPairOutput): TokenPairDto {
    const dto = new TokenPairDto();
    dto.accessToken = output.accessToken;
    dto.refreshToken = output.refreshToken;
    return dto;
  }
}
