import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';
import { Hashtag, HashtagDocument } from './hashtag.entity';

@Injectable()
export class HashtagService {
  constructor(
    @InjectModel(Hashtag.name)
    private readonly hashtagModel: Model<HashtagDocument>,
  ) {}

  async updateHashtag(
    count: number,
    hashtag: string,
  ): Promise<HashtagDocument> {
    const hashtagDoc = await this.hashtagModel.findOne({
      name: hashtag,
    });

    if (!hashtagDoc) {
      return this.hashtagModel.create({
        name: hashtag,
        count,
      });
    }
    hashtagDoc.count += count;
    return await hashtagDoc.save();
  }

  async getMostPopularHashtags(limit: number): Promise<HashtagDocument[]> {
    return await this.hashtagModel
      .find({
        count: { $gt: 0 },
      })
      .sort({ count: -1 })
      .limit(limit);
  }

  async findAll(option: QueryOption, conditions: any = {}): Promise<Hashtag[]> {
    return this.hashtagModel
      .find(conditions)
      .sort(option.sort)
      .skip(option.skip)
      .limit(option.limit);
  }

  count({ conditions }: { conditions?: any } = {}): Promise<number> {
    return Object.keys(conditions || {}).length > 0
      ? this.hashtagModel.countDocuments(conditions).exec()
      : this.hashtagModel.estimatedDocumentCount().exec();
  }

  async findAllAndCount(
    option: QueryOption,
    conditions: any = {},
  ): Promise<ResponseDTO> {
    const data = await this.findAll(option, conditions);
    const total = await this.count({ conditions });
    return { data, total };
  }

  async search(search: string, query: QueryPostOption) {
    const conditions = {
      name: { $regex: search, $options: 'i' },
      count: { $gt: 0 },
    };

    return this.findAllAndCount(query.options, conditions);
  }
}
