import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import { type CachePolicyPort } from '../../application';

@Injectable()
export class ConfigCachePolicyAdapter implements CachePolicyPort {
  constructor(private readonly configService: ConfigService) {}

  getDefaultTtlMs(): number {
    return this.configService.get<number>(
      'auth.cacheDefaultTtlMs',
      15 * 60 * 1000,
    );
  }

  getMaxTtlMs(): number {
    return this.configService.get<number>('auth.cacheMaxTtlMs', 60 * 60 * 1000);
  }
}
