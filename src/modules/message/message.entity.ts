import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User, UserDocument } from "../user/user.entity";
import { Document, Schema as MongoSchema } from 'mongoose'
import { Room, RoomDocument } from "../room/room.entity";

@Schema({
    collection: 'messages',
    toJSON: { virtuals: true },
})
export class Message {
    @Prop()
    content: string;

    @Prop()
    file?: string;

    @Prop()
    createdAt: Date;

    @Prop({ type: MongoSchema.Types.ObjectId, ref: User.name })
    sentBy: UserDocument | MongoSchema.Types.ObjectId;

    @Prop()
    roomId: string;

}

export const MessageSchema = SchemaFactory.createForClass(Message);

export interface MessageDocument extends Message, Document { };