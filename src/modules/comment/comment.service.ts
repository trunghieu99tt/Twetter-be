import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Schema } from 'mongoose';
import { QueryPostOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { Comment, CommentDocument, COMMENT_MODEL } from './comment.entity';
import { CreateCommentDTO } from './dto/createComment.dto';

@Injectable()
export class CommentService {
    constructor(
        @InjectModel(Comment.name) private commentModel: Model<CommentDocument>,
    ) { }

    async createComment(createCommentDto: CreateCommentDTO, user: UserDocument, tweetId: string): Promise<CommentDocument> {
        const tweetObjectId = new Schema.Types.ObjectId(tweetId);
        const newComment = new this.commentModel(createCommentDto);
        newComment.author = user;
        newComment.tweet = tweetObjectId;

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

        try {
            const comment = await this.commentModel.findByIdAndUpdate(commentId, updateCommentDto);
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

    async findCommentsByTweetId(tweetId: string, query: QueryPostOption): Promise<CommentDocument[]> {
        try {
            const comments = await this.commentModel.find({
                tweet: new Schema.Types.ObjectId(tweetId),
                ...query.conditions,
            })
                .setOptions(query.options);
            return comments;
        } catch (error) {
            throw new BadRequestException(error);
        }
    }

    async findCommentsByUserId(userId: string, page: number, pageSize: number): Promise<CommentDocument[]> {
        try {
            // find comments by user id
            const comments = await this.commentModel.find({
                "author._id": new Schema.Types.ObjectId(userId),
            })
                .skip(page * pageSize)
                .limit(pageSize);

            return comments;
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
