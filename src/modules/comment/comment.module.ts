import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Comment, CommentSchema } from './comment.entity';
import { CommentService } from './comment.service';
import { CommentController } from './comment.controller';
import { TweetModule } from '../tweet/tweet.module';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Comment.name, schema: CommentSchema },
        ]),
        TweetModule
    ],
    providers: [CommentService],
    controllers: [CommentController],
})
export class CommentModule { }
