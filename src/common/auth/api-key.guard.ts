import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { AppError } from 'src/common';

@Injectable()
export class ApiKeyGuard implements CanActivate {
  constructor(private readonly configService: ConfigService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers['x-api-key'];
    const expectedApiKey = this.configService.get<string>(
      'security.metrics.apiKey',
    );

    if (!apiKey || apiKey !== expectedApiKey) {
      throw new AppError('common.invalidApiKey');
    }

    return true;
  }
}
