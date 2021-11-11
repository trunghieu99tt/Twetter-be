import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { JWT_EXP, JWT_SECRET } from "src/common/config/env";
import { AuthModule } from "../auth/auth.module";
import { MessageSchema } from "../message/message.entity";
import { MessageModule } from "../message/message.module";
import { RoomModule } from "../room/room.module";
import { UserModule } from "../user/user.module";
import { ChatGateway } from "./chat.gateway";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: 'Message', schema: MessageSchema }
        ]),
        JwtModule.register({
            secret: JWT_SECRET,
            signOptions: {
                expiresIn: JWT_EXP
            }
        }),
        AuthModule,
        UserModule,
        MessageModule,
        RoomModule
    ],
    controllers: [],
    providers: [ChatGateway],

})
export class ChatModule { }