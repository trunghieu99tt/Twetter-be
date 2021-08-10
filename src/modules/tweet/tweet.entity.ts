import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsString } from "class-validator";
import { User, USER_MODEL } from "../user/user.entity";
import { Document, Schema as MongoSchema } from 'mongoose'
import { COMMENT_MODEL } from "../comment/comment.entity";

export const TWEET_MODEL = "tweets";

@Schema({
    timestamps: true,
    collection: TWEET_MODEL,
    toJSON: { virtuals: true }
})
export class Tweet {
    @IsString()
    @Prop({
        type: String,
        required: true,
    })
    content: string;

    @IsString()
    @Prop({
        type: String,
    })
    location: string;

    @Prop([String])
    tags: string[];

    @IsString()
    @Prop({
        type: String
    })
    media: string;

    @Prop({
        type: MongoSchema.Types.ObjectId,
        ref: USER_MODEL
    })
    author: User;

    @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: USER_MODEL }] })
    likes: User[];

    @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: COMMENT_MODEL }] })
    comments: Comment[];

    @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: USER_MODEL }] })
    retweet: User[];
}


export const TweetSchema = SchemaFactory.createForClass(Tweet);

export interface TweetDocument extends Tweet, Document { };