import { TokenPairDto } from './token-pair.output.dto';

describe('TokenPairDto', () => {
  describe('fromApplication', () => {
    it('maps accessToken and refreshToken from output', () => {
      const inputOutput = {
        accessToken: 'acc.jwt.token',
        refreshToken: 'ref.jwt.token',
      };

      const actualDto = TokenPairDto.fromApplication(inputOutput);

      expect(actualDto).toBeInstanceOf(TokenPairDto);
      expect(actualDto.accessToken).toBe('acc.jwt.token');
      expect(actualDto.refreshToken).toBe('ref.jwt.token');
    });

    it('creates a new instance on each call', () => {
      const inputOutput = { accessToken: 'acc', refreshToken: 'ref' };

      const actualFirst = TokenPairDto.fromApplication(inputOutput);
      const actualSecond = TokenPairDto.fromApplication(inputOutput);

      expect(actualFirst).not.toBe(actualSecond);
    });
  });
});
