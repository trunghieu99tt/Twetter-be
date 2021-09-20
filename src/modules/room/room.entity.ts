import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsString } from "class-validator";
import * as mongoose from 'mongoose';
import { Message } from "../message/message.entity";
import { User, UserDocument } from "../user/user.entity";

@Schema({
    collection: 'rooms',
    toJSON: {
        virtuals: true,
    }
})
export class Room {
    @IsString()
    @Prop()
    name: string;

    @IsString()
    @Prop()
    description: string;

    @IsString()
    @Prop()
    image: string;

    @Prop()
    createdAt: Date

    @Prop()
    updatedAt: Date;

    @Prop()
    isPrivate: boolean;

    @Prop()
    isDm: boolean;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    owner: UserDocument;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
    members: UserDocument[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);

export interface RoomDocument extends Room, Document { };