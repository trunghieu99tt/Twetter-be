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
import { Room, RoomDocument } from '../room/room.entity';
import { RoomService } from '../room/room.service';
import { UserDocument } from '../user/user.entity';
import { Server } from 'socket.io';
import { RoomDTO } from '../room/dto/create-room.dto';

@WebSocketGateway()
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

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
    private roomService: RoomService,
    private messageService: MessageService,
  ) {}

  async handleDisconnect(client: any) {
    // 1. remove user from connected users
    const user = this.connectedUsers.find((e) => e.socketId === client.id);

    // 2. if user is in connected users, update its call status
    // as well as fire message to client if user is in call
    if (user) {
      // 2.1. remove user from connected users list
      this.connectedUsers = this.connectedUsers.filter(
        (user: UserDocument) => user.socketId !== client.id,
      );

      this.processEndCall(user._id.toString());
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
      (room: RoomDocument) => room?._id?.toString() === roomId,
    );

    // 2. if we can't find room in connected room, try finding it in db
    if (!room) {
      room = await this.roomService.findById(roomId);
      this.connectedRooms.push(room);
    }

    return room;
  }

  // update call status of user
  updateUsers = (userId: string, callingId: string) => {
    this.connectedUsers.forEach((user: UserDocument) => {
      if (user._id.toString() === userId.toString()) {
        user.callingId = callingId;
      }
    });
  };

  findConnectedUserById(userId: string) {
    if (userId) {
      return this.connectedUsers.find(
        (user: UserDocument) => user._id.toString() === userId.toString(),
      );
    }
  }

  processEndCall(userId: string) {
    const user = this.findConnectedUserById(userId);
    const roomId = user?.callingId;

    if (roomId) {
      this.updateUsers(userId, null);

      const callingRoom = this.callingRoom[roomId];

      const newCallingRoom = callingRoom.filter(
        (user: { socketId: string; userId: string }) => user.userId !== userId,
      );

      if (newCallingRoom?.length < 2) {
        // emit close call event to every user in the room
        newCallingRoom.forEach((user: { socketId: string; userId: string }) => {
          this.updateUsers(user.userId, null);
          this.server.to(user.socketId).emit('closeCall', {
            roomId: roomId,
          });
        });
        this.callingRoom[roomId] = [];
        this.changeRoomCallState(roomId, false);
      } else {
        this.callingRoom[roomId] = newCallingRoom;
        newCallingRoom.forEach((user: { socketId: string; userId: string }) => {
          this.server.to(user.socketId).emit('userLeft', userId);
        });
      }
    }
  }

  addUserToRoom(
    roomId: string,
    newUserJoinsRoom: {
      userId: string;
      socketId: string;
    },
  ) {
    const { userId, socketId } = newUserJoinsRoom;
    if (this.callingRoom[roomId]) {
      // only add user if he's not in the room
      if (
        !this.callingRoom[roomId].some(
          (user: { socketId: string; userId: string }) =>
            user.userId === userId,
        )
      ) {
        this.callingRoom[roomId].push(newUserJoinsRoom);
      } else {
        this.callingRoom[roomId] = this.callingRoom[roomId].map(
          (user: { socketId: string; userId: string }) => {
            if (user.userId === userId) {
              user.socketId = socketId;
            }
            return user;
          },
        );
      }
    } else {
      this.callingRoom[roomId] = [newUserJoinsRoom];
    }
  }

  async findRoom(memberIds: string[]) {
    if (memberIds.length === 1) {
      return null;
    }

    // 1. find in connected rooms
    let room = this.connectedRooms.find((room: RoomDocument) => {
      const roomMemberIds =
        room?.members?.map((member: UserDocument) => member._id.toString()) ||
        [];

      return memberIds?.every((memberId: string) =>
        roomMemberIds?.includes(memberId),
      );
    });

    // 2. if we can't find room in connected rooms, try finding it in db
    if (!room) {
      room = await this.roomService.findDmRoom(memberIds[0], memberIds[1]);
      // add room to connected rooms
      this.connectedRooms.push(room);
    }

    // 3. if we can't find room in db, create it
    if (!room) {
      const newRoomDTO: RoomDTO = {
        name: '',
        isDm: true,
        members: memberIds,
        isPrivate: true,
        description: '',
      };
      room = await this.roomService.createRoom(newRoomDTO);
      this.connectedRooms.push(room);
    }

    return room;
  }

  async changeRoomCallState(roomId: string, hasCall: boolean) {
    const room = await this.getDMRoomById(roomId);
    if (room) {
      room?.members?.forEach((member: UserDocument) => {
        const connectedUser = this.findConnectedUserById(member._id);
        if (connectedUser?.socketId) {
          this.server.to(connectedUser.socketId).emit('roomCallStateChanged', {
            roomId,
            hasCall,
          });
        }
      });
    }
  }

  @SubscribeMessage('userOn')
  addUser(@MessageBody() body: any, @ConnectedSocket() client: any) {
    const newUserId = body?._id;
    if (newUserId) {
      const findUser = this.findConnectedUserById(newUserId);
      if (!findUser) {
        this.connectedUsers.push({
          ...body,
          socketId: client.id,
          callingId: null,
        });
        this.server.emit('users', this.connectedUsers);
      }
    }
  }

  @SubscribeMessage('userOff')
  removeUser(@MessageBody() body: any) {
    this.connectedUsers = this.connectedUsers.filter(
      (user: UserDocument) => user._id !== body._id,
    );
    this.processEndCall(body._id.toString());
    this.server.emit('users', this.connectedUsers);
  }

  @SubscribeMessage('newMessage')
  async handleAddMessage(@MessageBody() body: any) {
    if (body) {
      const roomId = body.roomId;
      try {
        const room = await this.getDMRoomById(roomId);

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
            this.server.to(user.socketId).emit('newMessage', newMessage);
          }
        });
      } catch (error) {
        console.log(error);
      }
    }
  }

  @SubscribeMessage('startCall')
  async handleStartCall(@MessageBody() body: any) {
    const { room, senderId } = body;

    const sender = this.findConnectedUserById(senderId);
    const roomId = room._id;

    this.updateUsers(senderId, room._id);

    const newRoomMember = {
      socketId: sender.socketId,
      userId: senderId,
    };

    if (this.callingRoom[roomId]) {
      // only add user if he's not in the room
      if (
        !this.callingRoom[roomId].some(
          (user: { socketId: string; userId: string }) =>
            user.userId === senderId,
        )
      ) {
        this.callingRoom[roomId].push(newRoomMember);
      }
    } else {
      this.callingRoom[roomId] = [newRoomMember];
    }

    room?.members?.forEach((member: UserDocument) => {
      if (member._id.toString() !== senderId.toString()) {
        const user = this.findConnectedUserById(member._id);
        if (user && !user?.callingId) {
          if (user?.socketId) {
            this.server.to(user.socketId).emit('hasCall', body);
          }
        }
      }
    });
  }

  @SubscribeMessage('requestEndCall')
  async handleEndCall(@MessageBody() leftUserId: string) {
    this.processEndCall(leftUserId);
  }

  @SubscribeMessage('requestJoinRoom')
  async handleJoinRoom(@MessageBody() body: any) {
    const { userId, roomId } = body;
    const user = this.findConnectedUserById(userId);

    if (user?.socketId) {
      const newUserJoinsRoom = {
        userId: user._id.toString(),
        socketId: user.socketId,
      };

      this.addUserToRoom(roomId, newUserJoinsRoom);
      this.updateUsers(userId, roomId);

      const roomUserIds = this.callingRoom[roomId]
        .map((u: any) => u.userId)
        .filter((u: any) => u !== userId);

      this.server.to(user.socketId).emit('otherUsersInRoom', roomUserIds);
    }
  }

  @SubscribeMessage('sendingSignal')
  async handleSendingSignal(@MessageBody() body: any) {
    const { targetUserId, currentUserId, signal } = body;

    const targetUser = this.findConnectedUserById(targetUserId);

    if (targetUser?.socketId) {
      this.server.to(targetUser.socketId).emit('userJoined', {
        signal,
        newUserId: currentUserId,
      });
    }
  }

  @SubscribeMessage('returningSignal')
  async handleReturningSignal(@MessageBody() body: any) {
    const { signal, newUserId, signalOwnerId } = body;
    const newUser = this.findConnectedUserById(newUserId);

    if (newUser?.socketId) {
      this.server.to(newUser.socketId).emit('receivingReturnedSignal', {
        signal,
        signalOwnerId,
      });
    }
  }

  @SubscribeMessage('userChangeSetting')
  async handleUserChangeSetting(@MessageBody() body: any) {
    const { data, roomId, currentUserId } = body;

    this.callingRoom[roomId].forEach((userInRoom) => {
      if (userInRoom.userId !== currentUserId) {
        this.server.to(userInRoom.socketId).emit('userChangeSetting', data);
      }
    });
  }

  @SubscribeMessage('answerCall')
  async handleAnswerCall(@MessageBody() body: any) {
    const { ownerCallId, userRepliedId, roomId } = body;
    const ownerCall = this.findConnectedUserById(ownerCallId);
    const userReplied = this.findConnectedUserById(userRepliedId);

    if (ownerCall?.socketId && userReplied?.socketId) {
      this.updateUsers(userRepliedId, roomId);
      this.addUserToRoom(roomId, {
        userId: userRepliedId,
        socketId: userReplied.socketId,
      });
      this.server.to(ownerCall.socketId).emit('answerCall', body);
      this.changeRoomCallState(roomId, true);
    }
  }

  @SubscribeMessage('roomHasCall')
  async handleRoomHasCall(@MessageBody() body: any) {
    if (body?.roomId) {
      const room = this.connectedRooms.find(
        (r: RoomDocument) => r._id.toString() === body.roomId,
      );
      if (room) {
        room.members.forEach((member: UserDocument) => {
          const user = this.findConnectedUserById(member._id);
          if (user?.socketId) {
            this.server.to(user.socketId).emit('roomHasCall', body);
          }
        });
      }
    }
  }

  @SubscribeMessage('newDMRoom')
  async handleNewRoom(@MessageBody() body: any) {
    const { owner, members } = body;
    const ownerUser = this.findConnectedUserById(owner);
    if (ownerUser?.socketId) {
      const room = await this.findRoom(members);
      if (room) {
        console.log('Go to emit newDMRoom');
        console.log(`ownerUser.socketId`, ownerUser.socketId);
        this.server.to(ownerUser.socketId).emit('newDMRoom', room);
      }
    }
  }

  // notifications
  @SubscribeMessage('createNotification')
  async handleCreateNotification(@MessageBody() body: any) {
    const receivers = body?.receivers || [];
    console.log(`receivers`, receivers);
    console.log(`connectedUsers`, this.connectedUsers);
    receivers.forEach((id: string) => {
      const user = this.connectedUsers.find((e) => e._id.toString() === id);
      console.log('userId: ', user);
      if (user) {
        this.server.to(user.socketId).emit('newNotification', body);
      }
    });
  }
}
