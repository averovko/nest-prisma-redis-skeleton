import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';
import { GlobalErrorFilter } from './error.filter';
import { AppError } from './app.error';

const buildHost = (responseMock: Record<string, jest.Mock>): ArgumentsHost => {
  const response = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    ...responseMock,
  };

  return {
    switchToHttp: jest.fn().mockReturnValue({
      getResponse: jest.fn().mockReturnValue(response),
    }),
  } as unknown as ArgumentsHost;
};

describe('GlobalErrorFilter', () => {
  let filter: GlobalErrorFilter;
  let statusMock: jest.Mock;
  let jsonMock: jest.Mock;
  let host: ArgumentsHost;

  beforeEach(() => {
    filter = new GlobalErrorFilter();
    statusMock = jest.fn().mockReturnThis();
    jsonMock = jest.fn().mockReturnThis();
    host = buildHost({ status: statusMock, json: jsonMock });
  });

  describe('AppError handling', () => {
    it('responds with error.status and correct JSON body', () => {
      const error = new AppError(
        'auth.invalid-token',
        { message: 'Token expired', status: HttpStatus.UNAUTHORIZED },
        { params: { extra: 'data' } },
      );

      filter.catch(error, host);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.UNAUTHORIZED);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({
          code: 'auth.invalid-token',
          message: 'Token expired',
          params: { extra: 'data' },
        }),
      );
    });

    it('includes ISO timestamp in the response', () => {
      const error = new AppError('server.error', {
        message: 'Error',
        status: HttpStatus.INTERNAL_SERVER_ERROR,
      });

      filter.catch(error, host);

      const body = jsonMock.mock.calls[0][0];
      expect(typeof body.timestamp).toBe('string');
      expect(() => new Date(body.timestamp)).not.toThrow();
    });
  });

  describe('HttpException handling', () => {
    it('responds with exception status and http.error code', () => {
      const error = new HttpException('Not found', HttpStatus.NOT_FOUND);

      filter.catch(error, host);

      expect(statusMock).toHaveBeenCalledWith(HttpStatus.NOT_FOUND);
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'http.error' }),
      );
    });

    it('includes timestamp in the response', () => {
      const error = new HttpException('Bad request', HttpStatus.BAD_REQUEST);

      filter.catch(error, host);

      const body = jsonMock.mock.calls[0][0];
      expect(typeof body.timestamp).toBe('string');
    });

    it('spreads object response into params', () => {
      const errorBody = { message: 'Validation failed', errors: ['field'] };
      const error = new HttpException(errorBody, HttpStatus.BAD_REQUEST);

      filter.catch(error, host);

      const body = jsonMock.mock.calls[0][0];
      expect(body.params).toEqual(errorBody);
    });

    it('wraps string response in params.message', () => {
      const error = new HttpException('plain string', HttpStatus.FORBIDDEN);

      filter.catch(error, host);

      const body = jsonMock.mock.calls[0][0];
      expect(body.params).toEqual({ message: 'plain string' });
    });
  });

  describe('Unknown error handling', () => {
    it('responds with 500 and internal.error code', () => {
      const error = new Error('unexpected crash');

      filter.catch(error, host);

      expect(statusMock).toHaveBeenCalledWith(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
      expect(jsonMock).toHaveBeenCalledWith(
        expect.objectContaining({ code: 'internal.error' }),
      );
    });

    it('includes timestamp in the response', () => {
      const error = new Error('crash');

      filter.catch(error, host);

      const body = jsonMock.mock.calls[0][0];
      expect(typeof body.timestamp).toBe('string');
    });

    it('includes a human-readable message', () => {
      const error = new Error('crash');

      filter.catch(error, host);

      const body = jsonMock.mock.calls[0][0];
      expect(typeof body.message).toBe('string');
      expect(body.message.length).toBeGreaterThan(0);
    });
  });
});
