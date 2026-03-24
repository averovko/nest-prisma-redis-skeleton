import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type ExpectedApiKeyPort } from '../../application';

@Injectable()
export class ConfigExpectedApiKeyAdapter implements ExpectedApiKeyPort {
  constructor(private readonly configService: ConfigService) {}

  getExpectedApiKey(): string {
    return this.configService.get<string>('security.metrics.apiKey', '');
  }
}
