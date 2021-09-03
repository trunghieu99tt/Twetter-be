import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { CreateTweetDTO } from './dto/createTweet.dto';
import { Tweet, TweetDocument } from './tweet.entity';
import { UserService } from '../user/user.service';

@Injectable()
export class TweetService {

    constructor(
        @InjectModel(Tweet.name)
        private readonly tweetModel: Model<TweetDocument>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService
    ) { }


    async findAll(option: QueryOption, conditions: any = {}): Promise<TweetDocument[]> {
        return this.tweetModel
            .find(conditions)
            .sort(option.sort)
            .select({ password: 0, passwordConfirm: 0 })
            .skip(option.skip)
            .limit(option.limit)
            .populate('author', 'name avatar coverPhoto followers gender')
            .populate('retweetedBy', 'name avatar coverPhoto');
    }

    async getPublicOrFollowersOnlyTweets(user: UserDocument, option: QueryOption): Promise<{ data: TweetDocument[], total: number }> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following } },
                { author: user }
            ]
        }
        const data = await this.findAll(option, conditions);
        const total = await this.count({ conditions });
        return { data, total };
    }

    async getTweetsByUser(userId: string, option: QueryOption): Promise<{ data: TweetDocument[], total: number }> {
        const user = await this.userService.findById(userId);
        const conditions = {
            $or: [
                { author: user, isRetweet: false },
                { retweetedBy: user }
            ]
        }
        const data = await this.findAll(option, conditions);
        const total = await this.count({ conditions });
        return { data, total }
    }

    // create a tweet
    async createTweet(tweetDTO: CreateTweetDTO, user: UserDocument): Promise<TweetDocument> {
        const tweet = new this.tweetModel({ ...tweetDTO, createdAt: new Date(), modifiedAt: new Date(), isRetweet: false });
        tweet.author = user;
        try {
            const response = await tweet.save();
            return response;
        } catch (error) {
            console.log('error: ', error);
            throw new BadRequestException(error);
        }
    }

    async getTweet(id: string, user: UserDocument): Promise<TweetDocument> {
        // get tweet by id and populate author except password and passwordConfirm
        const tweet = await this.tweetModel.findById(id)
            .populate('author', 'name avatar coverPhoto followers gender')
            .exec();

        switch (JSON.stringify(tweet.audience)) {
            // if tweet is only me
            case '2':
                if (tweet?.author?._id.toString() !== user?._id?.toString() && tweet?.retweetedBy?._id.toString() !== user?._id?.toString()) {
                    throw new BadRequestException('You are not the author of this tweet');
                }
                return tweet;

            // if tweet is public
            case '0':
                return tweet;

            // if tweet is public/followers
            case '1': {

                if (tweet.author._id.toString() === user._id.toString() || tweet.retweetedBy._id.toString() === user._id.toString()) {
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
        if (user._id.toString() === tweet.author._id.toString() || user._id.toString() === tweet.retweetedBy._id.toString()) {
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

    async reactTweet(id: string, user: UserDocument): Promise<any> {
        const tweet = await this.getTweet(id, user);
        if (!tweet) {
            throw new BadRequestException('Tweet not found');
        }

        if (tweet.likes.includes(user._id)) {
            tweet.likes.splice(tweet.likes.indexOf(user._id), 1);
        } else {
            tweet.likes.push(user._id);
        }

        try {
            await tweet.save();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async reTweet(tweetId: string, user: UserDocument) {
        const tweet = await this.getTweet(tweetId, user);
        if (!tweet) {
            throw new BadRequestException('Tweet not found');
        }

        console.log('tweet: ', tweet);
        console.log('user: ', user);

        if (tweet?.author?._id.toString() === user?._id?.toString() || tweet?.retweetedBy?._id?.toString() === user?._id?.toString()) {
            throw new BadRequestException('You can not re-tweet your own tweet');
        }

        tweet.retweeted.push(user._id);

        const newTweet = new this.tweetModel({
            author: tweet.author,
            content: tweet.content,
            audience: 0,
            createdAt: new Date(),
            modifiedAt: new Date(),
            isRetweet: true,
            likes: [],
            media: tweet.media,
            tags: tweet.tags,
            retweet: [],
            retweetedBy: user
        });

        try {
            const response = await newTweet.save();
            return response;
        }
        catch (error) {
            throw new BadRequestException(error);
        }
    }

    async getMostPopularTweets(user: UserDocument, option: QueryOption): Promise<TweetDocument[]> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following } },
                { author: user }
            ]
        }

        option.sort = {
            ...option.sort,
            likes: -1
        }

        const tweets = await this.findAll(option, conditions);

        return this.findAll(option, conditions);
    }

    async getLatestTweets(user: UserDocument, option: QueryOption): Promise<TweetDocument[]> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following } },
                { author: user }
            ]
        }

        option.sort = {
            ...option.sort,
            modifiedAt: -1
        }

        return this.findAll(option, conditions);
    }

    count({ conditions }: { conditions?: any } = {}): Promise<number> {
        return Object.keys(conditions || {}).length > 0
            ? this.tweetModel.countDocuments(conditions).exec()
            : this.tweetModel.estimatedDocumentCount().exec();
    }

}
