import {
    BadRequestException,
    forwardRef,
    Inject,
    Injectable,
    NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { CreateTweetDTO } from './dto/createTweet.dto';
import { Tweet, TweetDocument } from './tweet.entity';
import { UserService } from '../user/user.service';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { ObjectId } from 'mongodb';

@Injectable()
export class TweetService {
    constructor(
        @InjectModel(Tweet.name)
        private readonly tweetModel: Model<TweetDocument>,
        @Inject(forwardRef(() => UserService))
        private readonly userService: UserService,
    ) {}

    async findAll(
        option: QueryOption,
        conditions: any = {},
    ): Promise<TweetDocument[]> {
        return this.tweetModel
            .find(conditions)
            .sort(option.sort)
            .select({ password: 0, passwordConfirm: 0 })
            .skip(option.skip)
            .limit(option.limit)
            .populate('author', 'name avatar coverPhoto followers gender')
            .populate('retweetedBy', 'name avatar coverPhoto')
            .populate('likes', 'name avatar bio')
            .populate('retweeted', 'name avatar bio')
            .populate('saved', 'name avatar bio');
    }

    async findAllAndCount(
        option: QueryOption,
        conditions: any = {},
    ): Promise<ResponseDTO> {
        const data = await this.findAll(option, conditions);
        const total = await this.count({ conditions });
        return { data, total };
    }

    async getPublicOrFollowersOnlyTweets(
        user: UserDocument,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following }, audience: 1 },
                { author: user },
            ],
        };
        return this.findAllAndCount(option, conditions);
    }

    async getTweetsByUser(
        userId: string,
        option: QueryOption,
        userRequest: UserDocument,
    ): Promise<ResponseDTO> {
        const user = await this.userService.findById(userId);
        const isUserRequestFollowingUser = userRequest.following.some(
            (u: UserDocument) => u._id.toString() === userId,
        );

        let conditions: any = {
            author: user,
            audience: 0,
        };

        if (
            user._id.toString() === userRequest._id.toString() ||
            isUserRequestFollowingUser
        ) {
            conditions = {
                $or: [
                    { author: user, isRetweet: false },
                    { retweetedBy: user },
                ],
            };
        }

        console.log(`conditions`, conditions);

        return this.findAllAndCount(option, conditions);
    }

    // create a tweet
    async createTweet(
        tweetDTO: CreateTweetDTO,
        user: UserDocument,
    ): Promise<TweetDocument> {
        const tweet = new this.tweetModel({
            ...tweetDTO,
            createdAt: new Date(),
            modifiedAt: new Date(),
            isRetweet: false,
        });
        tweet.author = user;
        try {
            const response = await tweet.save();
            return response;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    // get single tweet
    async getTweet(id: string, user: UserDocument): Promise<TweetDocument> {
        // get tweet by id and populate author except password and passwordConfirm
        const tweet = await this.tweetModel
            .findById(id)
            .populate('author', 'name avatar coverPhoto followers gender')
            .populate('retweetedBy', 'name avatar coverPhoto')
            .populate('likes', 'name avatar bio')
            .populate('retweeted', 'name avatar bio')
            .populate('saved', 'name avatar bio')
            .exec();

        const userId = user?._id?.toString() || '';
        const tweetAuthorId = tweet?.author?._id?.toString() || '';
        const retweetedById =
            (tweet?.isRetweet && tweet?.retweetedBy?._id?.toString()) || '';

        const isRetweet = tweet?.isRetweet || false;

        // we need these information for comparator step below
        // if they don't exist => our server caught error, so return null immediately without any comparator
        if (!user || !tweetAuthorId) return null;

        switch (JSON.stringify(tweet.audience)) {
            // if tweet is only me
            case '2':
                if (
                    userId !== tweetAuthorId &&
                    isRetweet &&
                    userId !== retweetedById
                ) {
                    throw new BadRequestException(
                        'You are not the author of this tweet',
                    );
                }
                return tweet;

            // if tweet is public
            case '0':
                return tweet;
            // if tweet is only visible for followers
            case '1': {
                if (userId === tweetAuthorId) return tweet;

                // check if user is following the author
                if (
                    !tweet?.author?.followers?.some(
                        (u) => u._id.toString() === userId,
                    ) &&
                    !user?.following?.includes(tweetAuthorId)
                ) {
                    throw new BadRequestException(
                        'You are not following the author of this tweet',
                    );
                }
                return tweet;
            }
            default:
                return null;
        }
    }

    // check if user is author of tweet or not
    async hasPermission(
        user: UserDocument,
        tweetId: string,
    ): Promise<TweetDocument | null> {
        const tweet: TweetDocument = await this.getTweet(tweetId, user);
        if (!tweet) {
            throw new BadRequestException('Tweet not found');
        }
        const userId = user?._id?.toString() || '';
        const tweetAuthorId = tweet?.author?._id?.toString() || '';
        const isRetweet = tweet?.isRetweet || false;

        const retweetedById =
            (tweet?.isRetweet && tweet?.retweetedBy?._id?.toString()) || '';
        if (
            userId === tweetAuthorId ||
            (isRetweet && userId === retweetedById)
        ) {
            return tweet;
        }
        return null;
    }

    // update a tweet
    async updateTweet(
        id: string,
        tweetDTO: CreateTweetDTO,
        user: UserDocument,
    ): Promise<TweetDocument> {
        const isAuthor = await this.hasPermission(user, id);
        if (!isAuthor) {
            throw new BadRequestException(
                'You have no permission to update this tweet',
            );
        }
        try {
            const response = await this.tweetModel
                .findByIdAndUpdate(id, tweetDTO, { new: true })
                .exec();
            return response;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    // delete a tweet
    async deleteTweet(id: string, user: UserDocument): Promise<any> {
        const tweet = await this.hasPermission(user, id);
        if (!tweet) {
            throw new BadRequestException(
                'You have no permission to delete this tweet',
            );
        }
        await this.tweetModel.findByIdAndRemove(id).exec();
    }

    async reactTweet(id: string, user: UserDocument): Promise<any> {
        const tweet = await this.getTweet(id, user);
        if (!tweet) {
            throw new BadRequestException('Tweet not found');
        }

        console.log(`tweet.likes`, tweet.likes);
        const didUserLiked = tweet.likes.some(
            (userLiked: UserDocument) =>
                userLiked._id.toString() === user._id.toString(),
        );

        if (didUserLiked) {
            tweet.likes = tweet.likes.filter(
                (userLiked) => userLiked._id.toString() !== user._id.toString(),
            );
        } else {
            tweet.likes.push(user);
        }

        try {
            await tweet.save();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async saveTweet(id: string, user: UserDocument): Promise<any> {
        const tweet = await this.getTweet(id, user);
        if (!tweet) {
            throw new BadRequestException('Tweet not found');
        }
        if (tweet.saved.includes(user._id)) {
            throw new BadRequestException('You have already saved this tweet');
        }
        tweet.saved.push(user._id);
        try {
            await tweet.save();
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async reTweet(tweetId: string, user: UserDocument) {
        try {
            const tweet = await this.getTweet(tweetId, user);
            if (!tweet) {
                throw new BadRequestException(
                    'You have no permission to retweet this tweet',
                );
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
                retweetedBy: user,
            });

            try {
                await tweet.save();
                const response = await newTweet.save();
                return response;
            } catch (error) {
                throw new BadRequestException(error);
            }
        } catch (error) {
            console.log(new Date(), 'retweet error: ', error.message);
            throw new BadRequestException(error);
        }
    }

    async getMostPopularTweets(
        user: UserDocument,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const following = user.following;
        const conditions = {
            $or: [{ audience: 0 }, { author: { $in: following } }],
        };

        const data = await this.tweetModel
            .aggregate([
                {
                    $addFields: {
                        likes_count: { $size: { $ifNull: ['$likes', []] } },
                    },
                },
                {
                    $sort: { likes_count: -1 },
                },
                {
                    $lookup: {
                        from: 'users',
                        localField: 'author',
                        foreignField: '_id',
                        as: 'author',
                    },
                },
                {
                    $unwind: '$author',
                },
                {
                    $match: conditions,
                },
            ])
            .skip(option.skip)
            .limit(option.limit)
            .exec();

        await this.tweetModel.populate(data, {
            path: 'retweetedBy',
            select: '_id name',
        });

        const total = await this.tweetModel.countDocuments(conditions);
        return { data, total };
    }

    async getLatestTweets(
        user: UserDocument,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following } },
                { author: user },
            ],
        };
        option.sort = {
            ...option.sort,
            modifiedAt: -1,
        };
        return this.findAllAndCount(option, conditions);
    }

    async getSavedTweets(
        user: UserDocument,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const conditions = {
            saved: user._id,
        };
        return this.findAllAndCount(option, conditions);
    }

    async getLikedTweets(
        userId: string,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const user = await this.userService.findById(userId);
        const conditions = {
            likes: user._id,
        };
        return this.findAllAndCount(option, conditions);
    }

    getMediaAggregation = () => {
        return [
            {
                $addFields: {
                    media_count: { $size: { $ifNull: ['$media', []] } },
                },
            },
            {
                $sort: { likes_count: -1 },
            },
            {
                $lookup: {
                    from: 'users',
                    localField: 'author',
                    foreignField: '_id',
                    as: 'author',
                },
            },
            {
                $unwind: '$author',
            },
        ];
    };

    async getMedias(
        user: UserDocument,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const following = user.following;
        const conditions = {
            $or: [
                { audience: 0 },
                { author: { $in: following } },
                { author: user },
            ],
        };

        const aggregation = [
            {
                $match: conditions,
            },
            ...this.getMediaAggregation(),
            {
                $match: {
                    media_count: { $gt: 0 },
                },
            },
        ];

        const data = await this.tweetModel
            .aggregate(aggregation)
            .skip(option.skip)
            .limit(option.limit)
            .exec();

        await this.tweetModel.populate(data, {
            path: 'retweetedBy',
            select: '_id name',
        });

        const dataTotal = await this.tweetModel
            .aggregate([
                ...aggregation,
                {
                    $count: 'total',
                },
            ])
            .exec();

        const total = dataTotal?.[0]?.total || 0;
        return { data, total };
    }

    async getUserMedias(
        userParam: UserDocument,
        userId: string,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        let user = userParam;
        const following = userParam.following;

        let conditions: any = {
            author: new ObjectId(userId),
        };

        if (userParam._id.toString() !== userId) {
            user = await this.userService.findById(userId);

            const isUserFollowing = following.some(
                (u: UserDocument) => u._id.toString() === userId,
            );
            console.log(`following`, following);
            console.log(`isUserFollowing`, isUserFollowing);

            if (isUserFollowing) {
                conditions = {
                    ...conditions,
                    audience: { $in: [0, 1] },
                };
            } else {
                conditions = {
                    ...conditions,
                    audience: 0,
                };
            }
        }

        console.log(`conditions getUserMedias`, conditions);

        const aggregation = [
            {
                $match: conditions,
            },
            ...this.getMediaAggregation(),
            {
                $match: {
                    media_count: { $gt: 0 },
                },
            },
        ];

        const data = await this.tweetModel
            .aggregate(aggregation)
            .skip(option.skip)
            .limit(option.limit)
            .exec();

        const dataTotal = await this.tweetModel
            .aggregate([
                ...aggregation,
                {
                    $count: 'total',
                },
            ])
            .exec();

        const total = dataTotal?.[0]?.total || 0;

        return { data, total };
    }

    count({ conditions }: { conditions?: any } = {}): Promise<number> {
        return Object.keys(conditions || {}).length > 0
            ? this.tweetModel.countDocuments(conditions).exec()
            : this.tweetModel.estimatedDocumentCount().exec();
    }

    async getTweetsByHashtag(
        user: UserDocument,
        hashtag: string,
        option: QueryOption,
    ): Promise<ResponseDTO> {
        const following = user.following;

        const conditions = {
            $and: [
                {
                    $or: [
                        { audience: 0 },
                        { author: { $in: following } },
                        { author: user },
                    ],
                },
                { tags: hashtag },
            ],
        };
        return this.findAllAndCount(option, conditions);
    }

    async countTweetByHashtag(hashtag: string): Promise<number> {
        const conditions = {
            tags: hashtag,
        };
        return this.tweetModel.countDocuments(conditions).exec();
    }

    async search(search: string, query: QueryPostOption) {
        const conditions = { content: { $regex: search, $options: 'i' } };
        return this.findAllAndCount(query.options, conditions);
    }

    async deleteTweetWithoutPermission(tweetId: string) {
        try {
            return this.tweetModel.findByIdAndDelete(tweetId);
        } catch (error) {
            console.log(`error`, error);
        }
    }

    async getReportedTweets() {
        const conditions = {
            reportedCount: { $gt: 0 },
        };
        return this.tweetModel
            .find(conditions)
            .populate('author', '_id name')
            .exec();
    }

    async createTweetByUserId(userId: string, tweetDto: CreateTweetDTO) {
        const user = await this.userService.findById(userId);
        if (user) {
            const tweet = await this.createTweet(tweetDto, user);
            return tweet;
        }
        return null;
    }

    async reportTweet(tweetId: string) {
        const tweet = await this.tweetModel.findById(tweetId);
        if (tweet) {
            tweet.reportedCount = tweet.reportedCount + 1;
            return tweet.save();
        } else {
            throw new NotFoundException(`Tweet not found`);
        }
    }
}
