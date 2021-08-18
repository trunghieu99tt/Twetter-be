import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { CreateTweetDTO } from './dto/createTweet.dto';
import { Tweet, TweetDocument } from './tweet.entity';

@Injectable()
export class TweetService {

    constructor(
        @InjectModel(Tweet.name)
        private readonly tweetModel: Model<TweetDocument>
    ) { }


    async findAll(option: QueryOption, conditions: any = {}): Promise<TweetDocument[]> {
        return this.tweetModel
            .find(conditions)
            .sort(option.sort)
            .select({ password: 0, passwordConfirm: 0 })
            .skip(option.skip)
            .limit(option.limit)
    }

    async getPublicOrFollowersOnlyTweets(user: UserDocument, option: QueryOption): Promise<TweetDocument[]> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following } },
                { author: user }
            ]
        }
        return this.findAll(option, conditions);
    }

    // create a tweet
    async createTweet(tweetDTO: CreateTweetDTO, user: UserDocument): Promise<TweetDocument> {
        const tweet = new this.tweetModel({ ...tweetDTO, createdAt: new Date(), modifiedAt: new Date() });
        tweet.author = user;
        try {
            const response = await tweet.save();
            return response;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    /**
     * Get a tweet by id
     *
     */
    async getTweet(id: string, user: UserDocument): Promise<TweetDocument> {
        // get tweet by id and populate author except password and passwordConfirm
        const tweet = await this.tweetModel.findById(id)
            .populate('author', 'name avatar coverPhoto followers')
            .exec();

        switch (JSON.stringify(tweet.audience)) {
            // if tweet is only me
            case '2':
                console.log(`user._id`, user._id);
                console.log(`tweet.author._id`, tweet.author._id)
                if (tweet?.author?._id.toString() !== user?._id?.toString()) {
                    throw new BadRequestException('You are not the author of this tweet');
                }
                return tweet;

            // if tweet is public
            case '0':
                return tweet;

            // if tweet is public/followers
            case '1': {

                if (tweet.author._id.toString() === user._id.toString()) {
                    return tweet;
                }

                // check if user is following the author
                if (!tweet.author.followers.includes(user._id) && !user.following.includes(tweet.author._id)) {
                    throw new BadRequestException('You are not following the author of this tweet');
                }
                return tweet;
            }
            default:
                return null;
        }
    }

    async hasPermission(user: UserDocument, tweetId: string): Promise<boolean> {
        const tweet: TweetDocument = await this.getTweet(tweetId, user);
        if (user._id.toString() === tweet.author._id.toString()) {
            return true;
        }
        return false;
    }


    // update a tweet
    async updateTweet(id: string, tweetDTO: CreateTweetDTO, user: UserDocument): Promise<TweetDocument> {
        const isAuthor = await this.hasPermission(user, id);
        if (!isAuthor) {
            throw new BadRequestException('You have no permission to update this tweet');
        }
        try {
            const response = await this.tweetModel.findByIdAndUpdate(id, tweetDTO, { new: true }).exec();
            return response;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    // delete a tweet
    async deleteTweet(id: string, user: UserDocument): Promise<any> {
        const isAuthor = await this.hasPermission(user, id);
        if (!isAuthor) {
            throw new BadRequestException('You have no permission to delete this tweet');
        }
        await this.tweetModel.findByIdAndRemove(id).exec();
    }

}
