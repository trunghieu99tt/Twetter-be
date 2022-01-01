import { forwardRef, Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tweet, TweetSchema } from './tweet.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CommentModule } from '../comment/comment.module';

@Module({
    imports: [
        MongooseModule.forFeature([{ name: Tweet.name, schema: TweetSchema }]),
        forwardRef(() => UserModule),
        forwardRef(() => CommentModule),
    ],
    providers: [TweetService],
    controllers: [TweetController],
    exports: [TweetService],
})
export class TweetModule {}
