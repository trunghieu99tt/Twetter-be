import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import * as mongoose from 'mongoose';
import { User, UserDocument } from '../user/user.entity';

@Schema({
    collection: 'stories',
    toJSON: {
        virtuals: true,
    },
})
export class Story {
    _id: string;

    @IsString()
    @Prop(String)
    content: string;

    @IsString()
    @Prop(String)
    type: string;

    @Prop(Number)
    audience: number;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    owner: UserDocument;

    @Prop()
    viewerIds: string[];

    @Prop(Date)
    createdAt: Date;
}

export const StorySchema = SchemaFactory.createForClass(Story);

export interface StoryDocument extends Story, Document {}
