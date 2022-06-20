import { Inject, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { ObjectId } from 'mongodb';
import { Model } from 'mongoose';
import { ResponseDTO } from 'src/common/dto/response.dto';
import { QueryOption } from 'src/tools/request.tool';
import { UserDocument } from '../user/user.entity';
import { UserService } from '../user/user.service';
import { CreateMessageDTO } from './dto/create-message.dto';
import { Message, MessageDocument } from './message.entity';

@Injectable()
export class MessageService {
  constructor(
    @InjectModel(Message.name)
    private readonly messageModel: Model<MessageDocument>,
  ) {}

  async findAll(
    option: QueryOption,
    conditions: any = {},
  ): Promise<MessageDocument[]> {
    return this.messageModel
      .find(conditions)
      .sort({
        ...option.sort,
        createdAt: -1,
      })
      .skip(option.skip)
      .limit(option.limit)
      .populate('author', '_id name avatar');
  }

  count({ conditions }: { conditions?: any } = {}): Promise<number> {
    return Object.keys(conditions || {}).length > 0
      ? this.messageModel.countDocuments(conditions).exec()
      : this.messageModel.estimatedDocumentCount().exec();
  }
  async findById(id: string): Promise<MessageDocument> {
    return await this.messageModel.findById(id);
  }

  async createMessage(
    messageDto: CreateMessageDTO,
    roomId: string,
  ): Promise<MessageDocument> {
    const newMessage = new this.messageModel({
      ...messageDto,
      roomId: roomId,
      createdAt: new Date(),
    });
    return newMessage.save();
  }

  async getRoomMessages(
    roomId: string,
    option: QueryOption,
  ): Promise<ResponseDTO> {
    const conditions = {
      roomId: new ObjectId(roomId),
    };

    console.log('conditions getRoomMessages: ', conditions);

    const data = await this.findAll(option, conditions);
    const total = await this.count({ conditions });

    return {
      data,
      total,
    };
  }
}
