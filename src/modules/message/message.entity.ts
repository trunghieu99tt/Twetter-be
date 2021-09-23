import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User, UserDocument } from "../user/user.entity";
import { Document, Schema as MongoSchema } from 'mongoose'
import { Room, RoomDocument } from "../room/room.entity";

@Schema({
    collection: 'messages',
    toJSON: { virtuals: true },
})
export class Message {
    @Prop(String)
    content: string;

    @Prop(String)
    file?: string;

    @Prop(Date)
    createdAt: Date;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: User.name })
    author: UserDocument;

    @Prop(String)
    roomId: string;

}

export const MessageSchema = SchemaFactory.createForClass(Message);

export interface MessageDocument extends Message, Document { };