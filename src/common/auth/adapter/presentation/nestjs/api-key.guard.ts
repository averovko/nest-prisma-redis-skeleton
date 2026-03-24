import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
} from '@nestjs/common';
import { Request } from 'express';

import {
  VALIDATE_API_KEY_USE_CASE,
  type IValidateApiKeyUseCase,
} from '../../../application';
import { rethrowAsAppError } from './auth-error.mapper';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(
    @Inject(VALIDATE_API_KEY_USE_CASE)
    private readonly validateApiKey: IValidateApiKeyUseCase,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const rawHeader = request.headers['x-api-key'];
    const apiKey = Array.isArray(rawHeader) ? rawHeader[0] : rawHeader;
    try {
      this.validateApiKey.execute(apiKey);
    } catch (err) {
      rethrowAsAppError(err);
    }
    return true;
  }
}
