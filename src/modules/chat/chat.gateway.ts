import { ConsoleLogger, Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { ConnectedSocket, MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { MessageService } from "../message/message.service";
import { RoomDTO } from "../room/dto/create-room.dto";
import { Room, RoomDocument } from "../room/room.entity";
import { RoomService } from "../room/room.service";
import { User, UserDocument } from "../user/user.entity";
import { UserService } from "../user/user.service";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server;

    rooms: Room[] = [];
    connectedUsers: UserDocument[] = [];
    connectedRooms: RoomDocument[] = [];
    mappedSocketId: {
        [key: string]: string
    } = {};

    constructor(private jwtService: JwtService,
        private userService: UserService,
        private roomService: RoomService,
        private messageService: MessageService) {
    }

    async handleDisconnect(client: any) {
    }

    async handleConnection(client: any, ...args: any[]) {
    }

    async getDMRoomByUsers(ownerId: string, guestId: string) {
        let room = null;
        // 1. find in connected room if we could find room which is dm 
        // and has 2 users where one of them is author, and other has id equals to roomId
        room = this.connectedRooms.find((room: RoomDocument) => {
            const { isDm, members } = room;
            // 1.1. room must be isDm
            if (!isDm)
                return false;

            // 1.2. author of message is in room
            if (!members.some((member: UserDocument) => member._id.toString() === ownerId))
                return false;

            // 1.3. one member has _id equals to roomId
            if (!members.some((member: UserDocument) => member._id.toString() === guestId))
                return false;

            return true;
        });

        // 2. If we can't find room in connected room, try finding it in db
        if (!room) {
            room = await this.roomService.findDmRoom(ownerId, guestId);
        }

        // 3. If we still can't find any room, create a new room
        if (!room) {
            const newRoom: RoomDTO = {
                description: '',
                isDm: true,
                isPrivate: true,
                name: '',
                image: '',
            }
            room = await this.roomService.createRoom(newRoom, [ownerId, guestId]);
        }

        // 4. if room is not in connected room list -> add it
        if (!this.connectedRooms.find((connectedRoom: any) => connectedRoom._id === room._id)) {
            this.connectedRooms.push(room);
        }

        return room;
    }

    async getDMRoomById(roomId: string) {
        let room = null;
        // 1. find in connected room
        room = this.connectedRooms.find((room: RoomDocument) => room._id.toString() === roomId);

        // 2. if we can't find room in connected room, try finding it in db
        if (!room) {
            room = await this.roomService.findById(roomId);
        }

        return room;
    }

    @SubscribeMessage('userOn')
    addUser(@MessageBody() body: any, @ConnectedSocket() client: any) {
        if (!this.connectedUsers?.some((user: UserDocument) => user._id === body._id)) {
            this.connectedUsers.push(body);
        }
        this.mappedSocketId[body._id] = client.id;
        this.server.emit('users', this.connectedUsers);
    }

    @SubscribeMessage('userOff')
    removeUser(@MessageBody() body: any) {
        console.log('user off: ', body);
        this.connectedUsers = this.connectedUsers.filter((user: UserDocument) => user._id !== body._id);
        this.server.emit('users', this.connectedUsers);
    }

    @SubscribeMessage('newMessage')
    async handleAddMessage(@MessageBody() body: any) {
        if (body) {
            const roomId = body.roomId;
            try {
                const room = await this.getDMRoomById(roomId);

                const newMessage = await this.messageService.createMessage(body, room._id);
                // Emit event to all users in that room. 
                console.log(`room`, room);
                console.log(`body`, body)
                room.members.forEach((member: UserDocument) => {
                    const socketId = this.mappedSocketId[member._id.toString()];
                    console.log(`socketId`, socketId)
                    this.server.to(socketId).emit('newMessage', newMessage);
                });

            } catch (error) {
                console.log(error);
            }
        }
    }

    @SubscribeMessage('createRoom')
    async handleGetRoom(@MessageBody() body: any) {
        const { username, channel } = body;
        const user = this.connectedUsers.find(e => e.username === username);
        const newRoom = await this.roomService.createRoom(channel, [user._id.toString()]);
        this.rooms = [
            ...this.rooms,
            newRoom
        ]
        this.server.emit('rooms', this.rooms);
    }

    /**
     * Event when user join a room which that user has not been a member yet
     * @param body
     */
    @SubscribeMessage('joinDmRoom')
    async handleJoinNewRoom(@MessageBody() body: any) {
        const userIds = body?.userIds;
        if (userIds?.length === 2) {
            const room = await this.getDMRoomByUsers(userIds[0], userIds[1]);
            console.log(`room`, room)
            this.server.emit('joinDmRoom', room);
        }
    }
}