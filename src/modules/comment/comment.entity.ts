import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsDate, IsString } from "class-validator";
import { Document, Schema as MongoSchema } from "mongoose";
import { User, USER_MODEL } from "../user/user.entity";

export const COMMENT_MODEL = 'comments';

@Schema({
    timestamps: true,
    collection: COMMENT_MODEL,
    toJSON: { virtuals: true }
})
export class Comment {
    @IsString()
    @Prop(String)
    content: string;

    @IsDate()
    @Prop(Date)
    createdAt: Date;

    @IsDate()
    @Prop(Date)
    modifiedAt: Date;

    @IsBoolean()
    @Prop(Boolean)
    isEdited: boolean;

    @IsString()
    @Prop(String)
    media: string;

    // author prop refs to a User
    @Prop({
        type: MongoSchema.Types.ObjectId, ref: USER_MODEL
    })
    author: User;

    @Prop({ type: [{ type: MongoSchema.Types.ObjectId, ref: COMMENT_MODEL }] })
    replies: Comment[];
}

export const CommentSchema = SchemaFactory.createForClass(Comment);

export interface CommentDocument extends Comment, Document { };