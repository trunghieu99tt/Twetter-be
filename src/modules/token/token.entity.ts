import { Prop, raw, Schema, SchemaFactory } from "@nestjs/mongoose";

@Schema({
    collection: 'tokens',
    toJSON: { virtuals: true }
})
export class Token {
    _id: string;

    @Prop()
    key: string;

    @Prop()
    expAt: number;

    @Prop()
    createdAt: number
}

export const TokenSchema = SchemaFactory.createForClass(Token);

export type TokenDocument = Token & Document;
