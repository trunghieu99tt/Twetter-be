import { Module } from '@nestjs/common';
import { CommentModule } from '../comment/comment.module';
import { HashtagModule } from '../hashtag/hashtag.module';
import { TweetModule } from '../tweet/tweet.module';
import { UserModule } from '../user/user.module';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';

@Module({
  imports: [TweetModule, CommentModule, HashtagModule, UserModule],
  providers: [SearchService],
  controllers: [SearchController],
})
export class SearchModule {}
