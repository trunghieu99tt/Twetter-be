import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DATABASE_URL } from './config/env';
import { CommentService } from './modules/comment/comment.service';
import { CommentModule } from './modules/comment/comment.module';
import { TweetModule } from './modules/tweet/tweet.module';
import { UserModule } from './modules/user/user.module';
import { UploadModule } from './modules/upload/upload.module';

@Module({
  imports: [
    MongooseModule.forRoot(DATABASE_URL, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
      useFindAndModify: false,
      useCreateIndex: true,
      retryDelay: 5000
    }),
    CommentModule,
    TweetModule,
    UserModule,
    UploadModule
  ],
  controllers: [],
  providers: [CommentService],
})
export class AppModule { }
