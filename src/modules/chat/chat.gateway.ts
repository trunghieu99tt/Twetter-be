import { Logger, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { MessageBody, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { MessageService } from "../message/message.service";
import { Room } from "../room/room.entity";
import { RoomService } from "../room/room.service";
import { User, UserDocument } from "../user/user.entity";
import { UserService } from "../user/user.service";

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server;

    rooms: Room[] = [];
    connectedUsers: UserDocument[] = [];

    constructor(private jwtService: JwtService,
        private userService: UserService,
        private roomService: RoomService,
        private messageService: MessageService) {
    }

    async handleDisconnect(client: any) {
    }


    async handleConnection(client: any, ...args: any[]) {
    }

    @SubscribeMessage('userOn')
    addUser(@MessageBody() body: any) {
        if (!this.connectedUsers?.some((user: UserDocument) => user._id === body._id)) {
            this.connectedUsers.push(body);
        }
        this.server.emit('users', this.connectedUsers);
    }

    @SubscribeMessage('userOff')
    removeUser(@MessageBody() body: any) {
        console.log('user off: ', body);
        this.connectedUsers = this.connectedUsers.filter((user: UserDocument) => user._id !== body._id);
        this.server.emit('users', this.connectedUsers);
    }

    @SubscribeMessage('addMessage')
    async handleAddMessage(@MessageBody() body: any) {
    }

    @SubscribeMessage('createRoom')
    async handleGetRoom(@MessageBody() body: any) {
        Logger.debug("call createRoom")
        const { username, channel } = body;
        const user = this.connectedUsers.find(e => e.username === username);
        const newRoom = await this.roomService.createRoom(channel, user);
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
    @SubscribeMessage('joinRoom')
    async handleJoinNewRoom(@MessageBody() body: any) {
        console.log('body: ', body);
    }

}