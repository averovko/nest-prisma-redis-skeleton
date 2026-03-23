import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { JwtTokenIssuer } from './jwt-token-issuer.service';

describe('JwtTokenIssuer', () => {
  let service: JwtTokenIssuer;
  let mockJwtService: jest.Mocked<JwtService>;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockJwtService = { sign: jest.fn() } as unknown as jest.Mocked<JwtService>;
    mockConfigService = {
      get: jest.fn()
        .mockReturnValueOnce('test-jwt-secret')
        .mockReturnValueOnce('1h')
        .mockReturnValueOnce('30d'),
    } as unknown as jest.Mocked<ConfigService>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtTokenIssuer,
        { provide: JwtService, useValue: mockJwtService },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get(JwtTokenIssuer);
  });

  describe('issueTokenPair', () => {
    it('returns access and refresh tokens', () => {
      mockJwtService.sign.mockReturnValueOnce('access.jwt.token').mockReturnValueOnce('refresh.jwt.token');

      const actualPair = service.issueTokenPair({ authId: 'auth-id-1', email: 'test@example.com' });

      expect(actualPair).toEqual({
        accessToken: 'access.jwt.token',
        refreshToken: 'refresh.jwt.token',
      });
    });

    it('signs access token with sub and email claims', () => {
      mockJwtService.sign.mockReturnValue('token');

      service.issueTokenPair({ authId: 'auth-id-1', email: 'test@example.com' });

      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        1,
        { sub: 'auth-id-1', email: 'test@example.com' },
        { secret: 'test-jwt-secret', expiresIn: '1h' },
      );
    });

    it('signs refresh token with sub claim only', () => {
      mockJwtService.sign.mockReturnValue('token');

      service.issueTokenPair({ authId: 'auth-id-1', email: 'test@example.com' });

      expect(mockJwtService.sign).toHaveBeenNthCalledWith(
        2,
        { sub: 'auth-id-1' },
        { secret: 'test-jwt-secret', expiresIn: '30d' },
      );
    });

    it('reads jwt secret, access expiry, and refresh expiry from config', () => {
      mockJwtService.sign.mockReturnValue('token');
      mockConfigService.get
        .mockReturnValueOnce('my-secret')
        .mockReturnValueOnce('15m')
        .mockReturnValueOnce('7d');

      service.issueTokenPair({ authId: 'auth-id-1', email: 'e@e.com' });

      expect(mockConfigService.get).toHaveBeenCalledWith('security.jwtSecret');
      expect(mockConfigService.get).toHaveBeenCalledWith('security.accessTokenExpiry');
      expect(mockConfigService.get).toHaveBeenCalledWith('security.refreshTokenExpiry');
    });
  });
});
