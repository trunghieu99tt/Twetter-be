import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IsString } from 'class-validator';
import * as mongoose from 'mongoose';
import { User, UserDocument } from '../user/user.entity';

@Schema({
    collection: 'notifications',
    toJSON: {
        virtuals: true,
    },
})
export class Notification {
    _id: string;

    @IsString()
    @Prop(String)
    url: string;

    @IsString()
    @Prop(String)
    text: string;

    @IsString()
    @Prop(String)
    image: string;

    @Prop()
    isRead: string[];

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    sender: UserDocument;

    @Prop()
    receivers: string[];

    @IsString()
    @Prop(String)
    type: string;

    @Prop(Date)
    createdAt: Date;
}

export const NotificationSchema = SchemaFactory.createForClass(Notification);

export interface NotificationDocument extends Notification, Document {}
