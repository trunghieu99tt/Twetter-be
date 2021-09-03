import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsString } from "class-validator";
import { User, UserDocument, USER_MODEL } from "../user/user.entity";
import { Document, Schema as MongoSchema } from 'mongoose'
import { EAudience } from "src/config/constants";

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
    @Prop([String])
    media: string[];

    @Prop({
        type: MongoSchema.Types.ObjectId,
        ref: User.name
    })
    author: UserDocument;

    @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: User.name }] })
    likes: UserDocument[];

    @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: User.name }] })
    retweeted: UserDocument[];

    @Prop({ type: MongoSchema.Types.ObjectId, ref: User.name })
    retweetedBy: UserDocument;

    @Prop({
        type: Date
    })
    createdAt: Date;

    @Prop({
        type: Date
    })
    modifiedAt: Date;

    @Prop({
        enum: Object.values(EAudience)
    })
    audience: EAudience;

    @Prop(Boolean)
    isRetweet: boolean;
}


export const TweetSchema = SchemaFactory.createForClass(Tweet);

export interface TweetDocument extends Tweet, Document { };