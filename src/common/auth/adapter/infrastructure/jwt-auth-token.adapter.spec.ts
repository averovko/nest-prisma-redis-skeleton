import { JwtService } from '@nestjs/jwt';

import { AuthAppError } from '../../application';
import { JwtAuthTokenAdapter } from './jwt-auth-token.adapter';
import type { JwtAuthTokenSettings } from './jwt-auth-token.settings';

function buildAdapter(
  jwtService: jest.Mocked<Pick<JwtService, 'decode' | 'verifyAsync'>>,
  settings: JwtAuthTokenSettings,
): JwtAuthTokenAdapter {
  return new (JwtAuthTokenAdapter as any)(jwtService, settings);
}

const mockJwtService: jest.Mocked<Pick<JwtService, 'decode' | 'verifyAsync'>> =
  {
    decode: jest.fn(),
    verifyAsync: jest.fn(),
  };

const noVerifySettings: JwtAuthTokenSettings = {
  shouldVerifyToken: false,
  jwtSecret: '',
};

const verifySettings: JwtAuthTokenSettings = {
  shouldVerifyToken: true,
  jwtSecret: 'secret',
};

describe('JwtAuthTokenAdapter', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('resolvePayload — shouldVerifyToken = false (decode only)', () => {
    it('returns TokenPayload from decoded token', async () => {
      mockJwtService.decode.mockReturnValue({
        sub: 'user-1',
        email: 'a@b.com',
        phone: '+1',
        exp: 9999,
      });
      const adapter = buildAdapter(mockJwtService, noVerifySettings);

      const result = await adapter.resolvePayload('token');

      expect(result).toEqual({
        sub: 'user-1',
        email: 'a@b.com',
        phone: '+1',
        exp: 9999,
      });
    });

    it('omits optional fields when not present in payload', async () => {
      mockJwtService.decode.mockReturnValue({ sub: 'user-2' });
      const adapter = buildAdapter(mockJwtService, noVerifySettings);

      const result = await adapter.resolvePayload('token');

      expect(result).toEqual({
        sub: 'user-2',
        email: undefined,
        phone: undefined,
        exp: undefined,
      });
    });

    it('throws invalid-token when decode returns null', async () => {
      mockJwtService.decode.mockReturnValue(null);
      const adapter = buildAdapter(mockJwtService, noVerifySettings);

      await expect(adapter.resolvePayload('bad')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });

    it('throws invalid-token when decode returns a string', async () => {
      mockJwtService.decode.mockReturnValue('just-a-string');
      const adapter = buildAdapter(mockJwtService, noVerifySettings);

      await expect(adapter.resolvePayload('bad')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });

    it('throws invalid-token when sub is missing', async () => {
      mockJwtService.decode.mockReturnValue({ email: 'a@b.com' });
      const adapter = buildAdapter(mockJwtService, noVerifySettings);

      await expect(adapter.resolvePayload('no-sub')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });

    it('throws invalid-token when sub is not a string', async () => {
      mockJwtService.decode.mockReturnValue({ sub: 123 });
      const adapter = buildAdapter(mockJwtService, noVerifySettings);

      await expect(adapter.resolvePayload('bad-sub')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });
  });

  describe('resolvePayload — shouldVerifyToken = true', () => {
    it('returns TokenPayload from verified token', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({
        sub: 'user-3',
        email: 'c@d.com',
        exp: 88888,
      });
      const adapter = buildAdapter(mockJwtService, verifySettings);

      const result = await adapter.resolvePayload('valid-token');

      expect(result).toEqual({
        sub: 'user-3',
        email: 'c@d.com',
        phone: undefined,
        exp: 88888,
      });
      expect(mockJwtService.verifyAsync).toHaveBeenCalledWith('valid-token', {
        secret: 'secret',
      });
    });

    it('throws invalid-token when verifyAsync rejects', async () => {
      mockJwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const adapter = buildAdapter(mockJwtService, verifySettings);

      await expect(adapter.resolvePayload('expired')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });

    it('re-throws AuthAppError as-is when verifyAsync throws AuthAppError', async () => {
      const appError = new AuthAppError('invalid-token');
      mockJwtService.verifyAsync.mockRejectedValue(appError);
      const adapter = buildAdapter(mockJwtService, verifySettings);

      await expect(adapter.resolvePayload('t')).rejects.toBe(appError);
    });

    it('throws invalid-token when verified sub is not a string', async () => {
      mockJwtService.verifyAsync.mockResolvedValue({ sub: 42 });
      const adapter = buildAdapter(mockJwtService, verifySettings);

      await expect(adapter.resolvePayload('t')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });

    it('uses String(err) when a non-Error is thrown by verifyAsync', async () => {
      mockJwtService.verifyAsync.mockRejectedValue('string-error');
      const adapter = buildAdapter(mockJwtService, verifySettings);

      await expect(adapter.resolvePayload('t')).rejects.toThrow(
        expect.objectContaining({ code: 'invalid-token' }),
      );
    });
  });
});
