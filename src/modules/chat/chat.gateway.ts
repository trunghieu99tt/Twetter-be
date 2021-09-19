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
        const jwt = client.handshake.query.token;
        if (jwt) {
            const auth: any = await this.jwtService.verify(
                jwt
            );
            const { sub } = auth;
            const user = await this.userService.findById(sub);
            if (user) {
                const onlineUsers = this.connectedUsers.filter((userItem: UserDocument) => userItem._id.toString() !== user._id.toString());
                this.connectedUsers = onlineUsers;
            }
            this.server.emit('users', this.connectedUsers);
        }
    }


    async handleConnection(client: any, ...args: any[]) {
        const jwt = client.handshake.query.token;

        if (jwt) {

            const auth: any = await this.jwtService.verify(
                jwt
            );

            const { sub } = auth;
            const user = await this.userService.findById(sub);

            if (!user) {
                throw new UnauthorizedException();
            }


            const existedUser = this.connectedUsers.find((e: UserDocument) => {
                return JSON.stringify(user._id) == JSON.stringify(e._id);
            });

            if (!existedUser) {
                this.connectedUsers = [... new Set([
                    ...this.connectedUsers,
                    user
                ])];
                this.server.emit('users', this.connectedUsers);
            }
        }
    }

    @SubscribeMessage('addMessage')
    async handleAddMessage(@MessageBody() body: any) {
        const username = body.username;
        const user = this.connectedUsers.find(e => e.username === username);
        await this.roomService.addMessage(body.roomID, {
            content: body.content
        }, user, body.file);
        const publicRoom = await this.roomService.getRooms();
        const privateRoom = await this.roomService.getRooms(user);
        this.rooms = [
            ...publicRoom,
            ...privateRoom
        ]
        Logger.debug(`this.rooms: ${this.rooms}`)
        this.server.emit('rooms', this.rooms);
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
        const { username, roomID } = body;
        const idx = this.connectedUsers.findIndex((e: User) => e.username === username);

        if (idx !== -1) {
            const user = this.connectedUsers[idx];
            await this.roomService.addMember(roomID, user);
            const publicRoom = await this.roomService.getRooms();
            const privateRoom = await this.roomService.getRooms(user);
            this.rooms = [
                ...publicRoom,
                ...privateRoom
            ]
            this.server.emit('rooms', this.rooms);
        }
    }

}