import { Inject, Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { ResponseDTO } from "src/common/dto/response.dto";
import { QueryOption } from "src/tools/request.tool";
import { User, UserDocument } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { CreateMessageDTO } from "./dto/create-message.dto";
import { Message, MessageDocument } from "./message.entity";

@Injectable()
export class MessageService {
    constructor(
        @InjectModel(Message.name)
        private readonly messageModel: Model<MessageDocument>,
    ) { }

    @Inject()
    private readonly userService: UserService;

    async findAll(option: QueryOption, conditions: any = {}): Promise<MessageDocument[]> {
        return this.messageModel
            .find(conditions)
            .sort(option.sort)
            .skip(option.skip)
            .limit(option.limit)
    }


    count({ conditions }: { conditions?: any } = {}): Promise<number> {
        return Object.keys(conditions || {}).length > 0
            ? this.messageModel.countDocuments(conditions).exec()
            : this.messageModel.estimatedDocumentCount().exec();
    }
    async findById(id: string): Promise<MessageDocument> {
        return await this.messageModel.findById(id);
    }

    async createMessage(user: UserDocument, messageDto: CreateMessageDTO, roomId: string, file: string = ''): Promise<MessageDocument> {
        const message = new Message();
        message.sentBy = user;
        message.roomId = roomId;
        message.createdAt = new Date();
        message.content = messageDto.content;

        if (file) {
            message.file = file;
        }
        const newMessage = new this.messageModel(message);
        const response = await newMessage.save();
        return response;
    }

    async getMessages(userId: string, roomId: string, option: QueryOption): Promise<ResponseDTO> {
        const conditions = {
            $and: [
                { sentBy: userId },
                { roomId: roomId },
            ],
        };

        const data = await this.findAll(option, conditions);
        const total = await this.count({ conditions });

        return {
            data, total
        }
    }
}