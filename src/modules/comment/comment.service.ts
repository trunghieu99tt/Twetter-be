import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
    ) { }

    async findAll(option: QueryOption, conditions: any = {}): Promise<CommentDocument[]> {
        return this.commentModel
            .find(conditions)
            .sort(option.sort)
            .select({ password: 0, passwordConfirm: 0 })
            .skip(option.skip)
            .limit(option.limit)
            .populate('likes', '_id avatar name')
            .populate("author", "name avatar coverPhoto");
    }

    async createComment(createCommentDto: CreateCommentDTO, user: UserDocument, tweetId: string): Promise<CommentDocument> {
        const tweet = await this.tweetService.getTweet(tweetId, user);

        if (!tweet) {
            throw new BadRequestException('Tweet not found');
        }

        const newComment = new this.commentModel(
            {
                ...createCommentDto,
                isEdited: false,
                tweet: tweet,
                author: user,
                modifiedAt: new Date(),
                createdAt: new Date(),
            }
        );

        try {
            const response = await newComment.save();
            return response;
        } catch (error) {
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

    async updateComment(commentId: string, updateCommentDto: CreateCommentDTO, user: UserDocument): Promise<CommentDocument> {
        const comment = await this.getCommentById(commentId);

        if (!comment) {
            throw new BadRequestException('Comment not found');
        }

        if (comment.author.username !== user.username) {
            throw new BadRequestException('You are not allowed to update this comment');
        }

        updateCommentDto.modifiedAt = new Date();
        updateCommentDto.isEdited = true;

        try {
            const comment = await this.commentModel.findByIdAndUpdate(commentId, updateCommentDto, { new: true });
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
            throw new BadRequestException('You are not allowed to delete this comment');
        }
        try {
            await this.commentModel.findByIdAndDelete(commentId);
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findCommentsByTweetId(tweetId: string, user: UserDocument, query: QueryPostOption): Promise<{ data: CommentDocument[], total: number }> {
        try {
            const tweet = await this.tweetService.getTweet(tweetId, user);
            if (!tweet) {
                throw new BadRequestException('Tweet not found');
            }
            const conditions = {
                "tweet": tweetId
            }
            const comments = await this.findAll(query.options, conditions);
            const total = await this.count({ conditions });
            return { data: comments, total };
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findCommentsByUser(user: UserDocument, query: QueryPostOption): Promise<{
        data: CommentDocument[], total: number
    }> {
        try {
            const conditions = {
                author: user._id
            }
            const comments = await this.findAll(query.options, conditions);
            const total = await this.count({ conditions });
            return { data: comments, total };
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    count({ conditions }: { conditions?: any } = {}): Promise<number> {
        return Object.keys(conditions || {}).length > 0
            ? this.commentModel.countDocuments(conditions).exec()
            : this.commentModel.estimatedDocumentCount().exec();
    }
}
