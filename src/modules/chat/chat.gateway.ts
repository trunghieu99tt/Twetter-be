import { ConsoleLogger, Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
} from '@nestjs/websockets';
import { MessageService } from '../message/message.service';
import { RoomDTO } from '../room/dto/create-room.dto';
import { Room, RoomDocument } from '../room/room.entity';
import { RoomService } from '../room/room.service';
import { User, UserDocument } from '../user/user.entity';
import { UserService } from '../user/user.service';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server;

    rooms: Room[] = [];
    callingRoom: {
        [key: string]: {
            socketId: string;
            userId: string;
        }[];
    } = {};
    connectedUsers: UserDocument[] = [];
    connectedRooms: RoomDocument[] = [];

    constructor(
        private jwtService: JwtService,
        private userService: UserService,
        private roomService: RoomService,
        private messageService: MessageService,
    ) {}

    async handleDisconnect(client: any) {
        console.log('client disconnected: ', client.id);
        // 1. remove user from connected users
        const user = this.connectedUsers.find((e) => e.socketId === client.id);

        // 2. if user is in connected users, update its call status
        // as well as fire message to client if user is in call
        if (user) {
            // 2.1. remove user from connected users list
            this.connectedUsers = this.connectedUsers.filter(
                (user: UserDocument) => user.socketId !== client.id,
            );

            this.server.emit('users', this.connectedUsers);

            // 2.2 update user call status
            if (user.callingId) {
                const guest = this.connectedUsers.find(
                    (e) => e._id.toString() === user.callingId,
                );
                this.updateUsers(user._id, null);
                if (guest?.socketId) {
                    this.server.to(guest.socketId).emit('callingUserIsOffline');
                }
            }
        }
    }

    async handleConnection(client: any, ...args: any[]) {
        console.log('client connected: ', client.id);
    }

    async getDMRoomById(roomId: string) {
        let room = null;
        // 1. find in connected room
        room = this.connectedRooms.find(
            (room: RoomDocument) => room._id.toString() === roomId,
        );

        // 2. if we can't find room in connected room, try finding it in db
        if (!room) {
            room = await this.roomService.findById(roomId);
        }

        return room;
    }

    // update call status of user
    updateUsers = (userId: string, callingId: string) => {
        this.connectedUsers.forEach((user: UserDocument) => {
            if (user._id.toString() === userId) {
                user.callingId = callingId;
            }
        });
    };

    @SubscribeMessage('userOn')
    addUser(@MessageBody() body: any, @ConnectedSocket() client: any) {
        this.connectedUsers.push({
            ...body,
            socketId: client.id,
            callingId: null,
        });
        this.server.emit('users', this.connectedUsers);
    }

    @SubscribeMessage('userOff')
    removeUser(@MessageBody() body: any) {
        this.connectedUsers = this.connectedUsers.filter(
            (user: UserDocument) => user._id !== body._id,
        );
        this.server.emit('users', this.connectedUsers);
    }

    @SubscribeMessage('newMessage')
    async handleAddMessage(@MessageBody() body: any) {
        if (body) {
            const roomId = body.roomId;
            try {
                let room = null;

                // 1. check if room is in connected rooms
                room = this.connectedRooms.find(
                    (room: RoomDocument) => room._id.toString() === roomId,
                );

                // 2. if not, get room from db and add it to connected rooms
                if (!room) {
                    room = await this.getDMRoomById(roomId);
                }

                const newMessage = await this.messageService.createMessage(
                    body,
                    room._id,
                );
                // Emit event to all users in that room if they're online
                room.members.forEach((member: UserDocument) => {
                    const user = this.connectedUsers.find(
                        (e) => e._id.toString() === member._id.toString(),
                    );
                    if (user?.socketId) {
                        this.server
                            .to(user.socketId)
                            .emit('newMessage', newMessage);
                    }
                });
            } catch (error) {
                console.log(error);
            }
        }
    }

    @SubscribeMessage('startCall')
    async handleStartCall(
        @MessageBody() body: any,
        @ConnectedSocket() client: any,
    ) {
        console.log(`body`, body);

        const { room, isVideoCall, senderId } = body;

        // 1. update call status of sender
        this.updateUsers(senderId, room._id);

        const memberIds =
            room?.members?.map((member: UserDocument) =>
                member._id.toString(),
            ) || [];

        memberIds?.forEach((userId: string) => {
            // check if user is online
            const user = this.connectedUsers.find(
                (e) => e._id.toString() === userId,
            );

            if (user?.socketId) {
                this.server.to(user.socketId).emit('callerConnected', body);
            }
        });

        // // 2. handle call user
        // if (guest) {
        //     // 2.1. if guest in another call -> fire busy message to client
        //     if (guest.callingId) {
        //         this.server.to(client.id).emit('userIsBusy');
        //         this.updateUsers(senderId, null);
        //     }
        //     // 2.2 if guest is not in another call -> update guest call status
        //     else {
        //         this.updateUsers(guestId, senderId);
        //         this.server.to(guest.socketId).emit('callerConnected', body);
        //     }
        // } else {
        //     // 2.3. if guest is not in connected users -> guest is offline,
        //     // fire event back to client
        //     this.server.to(client.id).emit('callingUserIsOffline');
        // }
    }

    @SubscribeMessage('endCall')
    async handleEndCall(
        @MessageBody() body: any,
        @ConnectedSocket() client: any,
    ) {
        const { senderId, guestId } = body;
        // 1. find users
        const sender = this.connectedUsers.find(
            (e) => e._id.toString() === senderId,
        );
        const guest = this.connectedUsers.find(
            (e) => e._id.toString() === guestId,
        );

        console.log(`sender.socketId`, sender?.socketId);
        console.log(`guest.socketId`, guest?.socketId);
        console.log(
            'connectedSockets: ',
            this.connectedUsers.map((e) => ({
                socketId: e.socketId,
                userId: e._id.toString(),
            })),
        );

        // 2. update call status
        if (guest) {
            /**
             * 2.2. update call status of both sender and guest
             * We have to do it because we can end call from both sender and guest
             * so client isn't guaranteed to be the sender
             */
            if (guest) {
                this.updateUsers(guestId, null);
                this.server.to(guest.socketId).emit('callDisconnected', body);
            }
            if (sender) {
                this.updateUsers(senderId, null);
                this.server.to(sender.socketId).emit('callDisconnected', body);
            }
        }
    }

    @SubscribeMessage('sendingSignal')
    async handleSendingSignal(
        @MessageBody() body: any,
        @ConnectedSocket() client: any,
    ) {
        const { userToSignal, signal, callerId } = body;
        const user = this.connectedUsers.find(
            (u: UserDocument) => u._id.toString() === userToSignal,
        );

        if (user?.socketId) {
            this.server.to(user.socketId).emit('userJoined', {
                signal,
                callerId,
            });
        }
    }

    @SubscribeMessage('returningSignal')
    async handleReturningSignal(
        @MessageBody() body: any,
        @ConnectedSocket() client: any,
    ) {
        const { signal, callerId } = body;
        const user = this.connectedUsers.find(
            (u: UserDocument) => u._id.toString() === callerId,
        );

        if (user?.socketId) {
            this.server.to(user.socketId).emit('receivingReturnedSignal', {
                signal,
                id: client.id,
            });
        }
    }

    @SubscribeMessage('joinRoom')
    async handleJoinRoom(@MessageBody() body: any) {
        const { userId, roomId } = body;
        const user = this.connectedUsers.find(
            (u: UserDocument) => u._id.toString() === userId,
        );
        if (user?.socketId) {
            
            const newUserJoinsRoom = {
                userId: user._id.toString(),
                socketId: user.socketId,
            }
            
            if (this.callingRoom[roomId]) {
                this.callingRoom[roomId].push(newUserJoinsRoom);
            } else {
                this.callingRoom[roomId] = [newUserJoinsRoom];
            }
            
            const roomUserIdsExceptUser = this.callingRoom[roomId].filter(
                (u: any) => u.userId !== userId,
            ).map((u: any) => u.userId);
            
            this.callingRoom[roomId].forEach((userInRoom) => {
                if(userInRoom.userId !== userId) {
                    this.server.to(userInRoom.socketId).emit('allUsers', roomUserIdsExceptUser);
                }
            }
            
        }
    }

    // notifications
    @SubscribeMessage('createNotification')
    async handleCreateNotification(@MessageBody() body: any) {
        console.log(`body`, body);
        const receivers = body?.receivers || [];
        receivers.forEach((id: string) => {
            console.log(`this.connectedUsers`, this.connectedUsers);
            console.log(`id`, id);
            const user = this.connectedUsers.find(
                (e) => e._id.toString() === id,
            );
            console.log(`user`, user);
            if (user) {
                this.server.to(user.socketId).emit('newNotification', body);
            }
        });
    }
}
