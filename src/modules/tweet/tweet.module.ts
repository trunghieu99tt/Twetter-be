import { forwardRef, Module } from '@nestjs/common';
import { TweetService } from './tweet.service';
import { TweetController } from './tweet.controller';
import { MongooseModule } from '@nestjs/mongoose';
import { Tweet, TweetSchema } from './tweet.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';

@Module({
	imports: [
		MongooseModule.forFeature([{ name: Tweet.name, schema: TweetSchema }]),
		forwardRef(() => UserModule)
	],
	providers: [TweetService],
	controllers: [TweetController],
	exports: [TweetService],
})
export class TweetModule { }
