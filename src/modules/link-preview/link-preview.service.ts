import { BadRequestException, Injectable } from '@nestjs/common';
import { LRUCache } from 'lru-cache';
import { parser } from 'html-metadata-parser';
import { isValidUrl, parseJson } from 'src/common/utils/helper';

const options = {
  max: 500,

  // for use with tracking overall storage size
  maxSize: 5000,
  sizeCalculation: (value, key) => {
    return 1;
  },

  ttl: 1000 * 60 * 5,
  allowStale: false,
  updateAgeOnGet: false,
  updateAgeOnHas: false,
};

@Injectable()
export class LinkPreviewService {
  cache: LRUCache<string, any>;
  constructor() {
    this.cache = new LRUCache(options);
  }

  async getLinkMetadata(url: string): Promise<any> {
    if (!isValidUrl(url)) {
      throw new BadRequestException('Invalid url');
    }
    const cached = this.cache.get(url);
    if (cached) {
      return parseJson(cached);
    }
    const metadata = await parser(url);
    this.cache.set(url, JSON.stringify(metadata));
    return metadata;
  }
}
