import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_URL } from './common/config/env';
import { CommentModule } from './modules/comment/comment.module';
import { TweetModule } from './modules/tweet/tweet.module';
import { UserModule } from './modules/user/user.module';
import { UploadModule } from './modules/upload/upload.module';
import { AuthModule } from './modules/auth/auth.module';
import { TokenModule } from './modules/token/token.module';
import { ChatModule } from './modules/chat/chat.module';
import { StoryModule } from './modules/story/story.module';
import { NotificationModule } from './modules/notification/notification.module';
import { HashtagModule } from './modules/hashtag/hashtag.module';
import { SearchModule } from './modules/search/search.module';
import { AgoraModule } from './modules/agora/Agora.module';
import { ConfigModule } from '@nestjs/config';
import config from './common/config';
import { AppController } from './app.controller';
import { LinkPreviewModule } from './modules/link-preview/link-preview.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      expandVariables: true,
      cache: true,
      load: [config],
    }),
    MongooseModule.forRoot(DATABASE_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      retryDelay: 5000,
    }),
    CommentModule,
    TweetModule,
    UserModule,
    UploadModule,
    AuthModule,
    TokenModule,
    ChatModule,
    StoryModule,
    NotificationModule,
    HashtagModule,
    SearchModule,
    AgoraModule,
    LinkPreviewModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
