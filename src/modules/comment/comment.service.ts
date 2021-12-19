import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import * as mongoose from 'mongoose';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { QueryOption, QueryPostOption } from 'src/tools/request.tool';
import { TweetService } from '../tweet/tweet.service';
import { UserDocument } from '../user/user.entity';
import { Comment, CommentDocument } from './comment.entity';
import { CreateCommentDTO } from './dto/createComment.dto';

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
        private readonly tweetService: TweetService,
        @InjectConnection() private readonly connection: mongoose.Connection,
    ) {}

    async findAll(
        option: QueryOption,
        conditions: any = {},
    ): Promise<CommentDocument[]> {
        return this.commentModel
            .find(conditions)
            .sort(option.sort)
            .select({ password: 0, passwordConfirm: 0 })
            .skip(option.skip)
            .limit(option.limit)
            .populate('author', 'name avatar coverPhoto')
            .populate('tweet', '_id')
            .populate({
                path: 'replies',
                populate: {
                    path: 'author',
                    select: '_id name avatar coverPhoto',
                },
            });
    }

    async findAllAndCount(
        option: QueryOption,
        conditions: any = {},
    ): Promise<ResponseDTO> {
        const data = await this.findAll(option, conditions);
        const total = await this.count({ conditions });
        return { data, total };
    }

    async createComment(
        createCommentDto: CreateCommentDTO,
        user: UserDocument,
        tweetId: string,
    ): Promise<CommentDocument> {
        // 1. find tweet by id
        let tweet = await this.tweetService.getTweet(tweetId, user);
        let parentComment = null;

        // if tweet not found -> this is a reply to a comment
        if (!tweet) {
            parentComment = await this.getCommentById(tweetId);
            if (!parentComment) {
                throw new BadRequestException('Comment not found');
            }
            tweet = parentComment.tweet;
        }

        const newComment = new this.commentModel({
            ...createCommentDto,
            isEdited: false,
            tweet: tweet,
            author: user,
            modifiedAt: new Date(),
            createdAt: new Date(),
            isChild: !!parentComment,
            likes: [],
        });

        // create transaction to save newComment and parentComment
        const session = await this.connection.startSession();
        session.startTransaction();
        try {
            const comment = await newComment.save();
            if (parentComment) {
                parentComment.replies.push(comment);
                await parentComment.save();
            }
            await session.commitTransaction();
            session.endSession();
            return comment;
        } catch (error) {
            await session.abortTransaction();
            session.endSession();
            throw new BadRequestException(error);
        }
    }

    async getCommentById(commentId: string): Promise<CommentDocument> {
        try {
            const comment = await this.commentModel.findById(commentId);
            return comment;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async updateComment(
        commentId: string,
        updateCommentDto: CreateCommentDTO,
        user: UserDocument,
    ): Promise<CommentDocument> {
        const comment = await this.getCommentById(commentId);

        if (!comment) {
            throw new BadRequestException('Comment not found');
        }

        if (comment.author.username !== user.username) {
            throw new BadRequestException(
                'You are not allowed to update this comment',
            );
        }

        updateCommentDto.modifiedAt = new Date();
        updateCommentDto.isEdited = true;

        try {
            const comment = await this.commentModel.findByIdAndUpdate(
                commentId,
                updateCommentDto,
                { new: true },
            );
            return comment;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async deleteComment(commentId: string, user: UserDocument): Promise<void> {
        const comment = await this.getCommentById(commentId);
        if (!comment) {
            throw new BadRequestException('Comment not found');
        }
        if (comment.author.username !== user.username) {
            throw new BadRequestException(
                'You are not allowed to delete this comment',
            );
        }
        try {
            await this.commentModel.findByIdAndDelete(commentId);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findCommentsByTweetId(
        tweetId: string,
        user: UserDocument,
        query: QueryPostOption,
    ): Promise<ResponseDTO> {
        try {
            const tweet = await this.tweetService.getTweet(tweetId, user);
            if (!tweet) {
                throw new BadRequestException('Tweet not found');
            }
            const conditions = {
                tweet: tweetId,
                isChild: false,
            };
            return this.findAllAndCount(query.options, conditions);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findCommentsByUser(
        user: UserDocument,
        query: QueryPostOption,
    ): Promise<ResponseDTO> {
        try {
            const conditions = {
                author: user._id,
            };
            return this.findAllAndCount(query.options, conditions);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    count({ conditions }: { conditions?: any } = {}): Promise<number> {
        return Object.keys(conditions || {}).length > 0
            ? this.commentModel.countDocuments(conditions).exec()
            : this.commentModel.estimatedDocumentCount().exec();
    }

    async search(user: UserDocument, search: string, query: QueryPostOption) {
        const conditions = {
            content: { $regex: search, $options: 'i' },
        };
        return this.findAllAndCount(query.options, conditions);
    }

    async reactComment(user: UserDocument, commentId: string) {
        const comment = await this.getCommentById(commentId);
        if (!comment) {
            throw new BadRequestException('Comment not found');
        }
        console.log(comment.likes, Array.isArray(comment.likes));
        const didUserLiked = comment.likes.some(
            (userId: string) => userId.toString() === user._id.toString(),
        );
        if (didUserLiked) {
            // remove like
            comment.likes = comment.likes.filter(
                (userId) => userId.toString() !== user._id.toString(),
            );
        } else {
            if (comment?.likes) {
                comment.likes.push(user._id);
            } else {
                console.log('Go here');
                comment.likes = [user._id];
            }
        }
        console.log('comment: ', comment);
        const response = await comment.save();
        return response;
    }
}
