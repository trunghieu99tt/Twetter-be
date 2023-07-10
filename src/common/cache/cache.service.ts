import { CACHE_MANAGER, Inject, Injectable } from '@nestjs/common';
import { Cache } from 'cache-manager';
import { parseJson } from '../utils/helper';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private readonly cache: Cache) {}

  async getAsJson(key: string): Promise<Record<string, unknown> | null> {
    const data = (await this.cache.get(key)) as any;
    return parseJson(data);
  }

  async set(key: string, value: string): Promise<string> {
    return this.cache.set(key, value);
  }
}
