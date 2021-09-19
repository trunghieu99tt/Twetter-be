import { Module } from "@nestjs/common";
import { MongooseModule } from "@nestjs/mongoose";
import { MessageModule } from "../message/message.module";
import { Room, RoomSchema } from "./room.entity";
import { RoomService } from "./room.service";

@Module({
    imports: [MessageModule, MongooseModule.forFeature([
        { name: Room.name, schema: RoomSchema },
    ]),],
    controllers: [],
    providers: [RoomService],
    exports: [RoomService],
})
export class RoomModule { }