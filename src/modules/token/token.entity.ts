import { Prop, raw, Schema, SchemaFactory } from '@nestjs/mongoose';

@Schema({
  collection: 'tokens',
  toJSON: { virtuals: true },
})
export class Token {
  @Prop(String)
  key: string;

  @Prop(Number)
  expAt: number;

  @Prop(Number)
  createdAt: number;
}

export const TokenSchema = SchemaFactory.createForClass(Token);

export interface TokenDocument extends Token, Document {}
