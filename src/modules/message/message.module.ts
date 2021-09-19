import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { UserModule } from "../user/user.module";
import { Message, MessageSchema } from "./message.entity";
import { MessageService } from "./message.service";

@Module({
    imports: [
        UserModule,
        MongooseModule.forFeature([{ name: Message.name, schema: MessageSchema }])
    ],
    providers: [MessageService],
    exports: [MessageService]
})
export class MessageModule { }