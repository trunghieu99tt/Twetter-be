import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MessageModule } from '../message/message.module';
import { UserModule } from '../user/user.module';
import { RoomController } from './room.controller';
import { Room, RoomSchema } from './room.entity';
import { RoomService } from './room.service';

@Module({
  imports: [
    MessageModule,
    UserModule,
    MongooseModule.forFeature([{ name: Room.name, schema: RoomSchema }]),
  ],
  controllers: [RoomController],
  providers: [RoomService],
  exports: [RoomService],
})
export class RoomModule {}
