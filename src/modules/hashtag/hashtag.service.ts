import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { Hashtag, HashtagDocument } from "./hashtag.entity";

@Injectable()
export class HashtagService {

    constructor(
        @InjectModel(Hashtag.name)
        private readonly hashtagModel: Model<HashtagDocument>,
    ) { }

    async updateHashtag(count: number, hashtag: string): Promise<HashtagDocument> {
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
        return await this.hashtagModel.find({
            count: { $gt: 0 },
        }).sort({ count: -1 }).limit(limit);
    }

}