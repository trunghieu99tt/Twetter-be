import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({
    collection: 'hashtags',
})
export class Hashtag {
    @Prop(String)
    name: string;

    @Prop(Number)
    count: number;
}

export const HashtagSchema = SchemaFactory.createForClass(Hashtag);

export interface HashtagDocument extends Hashtag, Document { };