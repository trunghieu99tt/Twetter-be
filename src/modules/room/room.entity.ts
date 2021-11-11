import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { IsBoolean, IsDate, IsString } from "class-validator";
import * as mongoose from 'mongoose';
import { User, UserDocument } from "../user/user.entity";

@Schema({
    collection: 'rooms',
    toJSON: {
        virtuals: true,
    }
})
export class Room {

    _id: string;

    @IsString()
    @Prop()
    name: string;

    @IsString()
    @Prop()
    roomId: string;

    @IsString()
    @Prop()
    description: string;

    @IsString()
    @Prop()
    image: string;

    @IsDate()
    @Prop(Date)
    createdAt: Date

    @IsDate()
    @Prop(Date)
    updatedAt: Date;

    @IsBoolean()
    @Prop(Boolean)
    isPrivate: boolean;

    @IsBoolean()
    @Prop(Boolean)
    isDm: boolean;

    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: User.name })
    owner: UserDocument;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: User.name }] })
    members: UserDocument[];
}

export const RoomSchema = SchemaFactory.createForClass(Room);

export interface RoomDocument extends Room, Document { };