import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Token, TokenDocument } from "./token.entity";
import { Model } from "mongoose";
import { AuthToolService } from "../tool/auth-tool/auth-tool.service";

@Injectable()
export class TokenService {
    constructor(@InjectModel(Token.name) private tokenModel: Model<TokenDocument>,
        private readonly authToolService: AuthToolService
    ) { }

    private JWTKey(userID: string, jti: string): string {
        return `JWT[${userID}][${jti}]`;
    }

    async setJWTKey(userID: string, jti: string, duration: number, timestamp: number): Promise<void> {
        const key = this.JWTKey(userID, jti);
        const expAt: number = timestamp + duration;
        const newToken = new this.tokenModel({
            key,
            expAt,
            createdAt: timestamp
        } as Token);

        try {
            await newToken.save();
        } catch (error) {
            throw error;
        }

    }

    async checkJWTKey(userID: string, jti: string): Promise<boolean> {
        const tokenDb = await this.tokenModel.findOne({ key: this.JWTKey(userID, jti) });
        return tokenDb != null;
    }

    async deleteJWTKey(userID: string, jti: string): Promise<number> {
        try {
            const response = await this.tokenModel.deleteOne({ key: this.JWTKey(userID, jti) });
            return response.ok;
        } catch (error) {
            console.log(`error`, error);
        }
    }
}