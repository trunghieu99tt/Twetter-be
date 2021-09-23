import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { Model } from "mongoose";
import { removeDuplicateObjectInArray } from "src/common/utils/helper";
import { QueryOption } from "src/tools/request.tool";
import { MessageService } from "../message/message.service";
import { UserDocument } from "../user/user.entity";
import { UserService } from "../user/user.service";
import { RoomDTO } from "./dto/create-room.dto";
import { Room, RoomDocument } from "./room.entity";

@Injectable()
export class RoomService {

    constructor(
        @InjectModel(Room.name)
        private roomModel: Model<RoomDocument>,
        private readonly messageService: MessageService,
        private readonly userService: UserService,
    ) { }


    async findAll(option: QueryOption, conditions: any = {}): Promise<RoomDocument[]> {
        return this.roomModel
            .find(conditions)
            .sort(option.sort)
            .skip(option.skip)
            .limit(option.limit)
    }

    async findById(id: string) {
        return await this.roomModel.findById(id).populate(
            {
                path: 'members',
            }
        ).exec();
    }

    async createRoom(roomDto: RoomDTO, users: string[]): Promise<RoomDocument> {
        const usersLists = await Promise.all(users.map(async userId => {
            return await this.userService.findById(userId);
        }));

        if (usersLists?.length > 0) {
            const newRoomObj = {
                ...roomDto,
                owner: usersLists[0],
                members: usersLists,
                createdAt: new Date(),
                updatedAt: new Date(),
                isDm: users.length === 2
            }
            const newRoom = new this.roomModel(newRoomObj);
            console.log(`newRoom`, newRoom)

            return await newRoom.save();
        } else {
            throw new BadRequestException("Users not found!");
        }
    }

    async findDmRoom(userIdA: string, userIdB: string): Promise<RoomDocument> {
        const [userA, userB] = await Promise.all([userIdA, userIdB].map(async userId => {
            return await this.userService.findById(userId)
        }))

        // check if userA and userB are in the same room
        const room = await this.roomModel.findOne({
            $or: [
                {
                    owner: userA,
                    members: userB,
                    isDm: true,
                },
                {
                    owner: userB,
                    members: userA,
                    isDm: true,
                }
            ]
        }).populate({
            path: "members"
        }).exec();

        return room;
    }

    async addMember(roomID: string, user: UserDocument) {
        const room = await this.findById(roomID);
        if (!room) {
            throw new NotFoundException("Room not found!");
        }
        const isInRoom = room.members.find((e: UserDocument) => e.username === user.username);
        if (isInRoom) {
            throw new BadRequestException("User's already in room!");
        }

        const roomMembers = removeDuplicateObjectInArray([...room.members, user._id]);
        room.members = roomMembers;

        await room.save();
    }

    async updateRoom(user: UserDocument, id: string, updateRoomDto: RoomDTO) {
        const room = await this.findById(id);
        if (!room) {
            throw new NotFoundException(`Room with ${id} not found!`);
        }
        if (room.owner._id.toString() !== user._id.toString()) {
            throw new UnauthorizedException("You do not have right to update this room!");
        }
        await this.roomModel.findByIdAndUpdate(id, updateRoomDto);
    }

    async getRoomsByUser(owner: UserDocument | null = null) {
        const options = owner ? {
            isPrivate: true,
            owner
        } : {
            isPrivate: false
        };

        return await this.roomModel.find(options).populate({
            path: 'messages',
            populate:
            {
                path: 'author'
            }
        }).populate({
            path: 'owner'
        }).populate({
            path: 'members'
        }).exec();
    }

    async getDMRoomOfUser(userAId: string, userBId: string) {
        const userA = await this.userService.findById(userAId);
        const userB = await this.userService.findById(userBId);
        const room = await this.roomModel.findOne({
            $or: [
                {
                    owner: userA,
                    members: userB,
                    isDm: true,
                },
                {
                    owner: userB,
                    members: userA,
                    isDm: true,
                }
            ]
        }).exec();

        if (!room) {
            throw new NotFoundException("Room not found!");
        }
        return room;
    }

    async deleteRoom(id: string) {
        return await this.roomModel.findByIdAndDelete(id).exec();
    }

}