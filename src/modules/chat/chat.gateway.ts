import { JwtCustomService } from 'src/modules/jwt-custom/jwt-custom.service';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsResponse,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { BackendService } from '../services/amqp/services/backend.service';
import { RedisService } from 'nestjs-redis';
import { User } from 'src/common/interfaces/user.interface';
import { UseGuards } from '@nestjs/common';
import { EmitSocketQueueService } from '../queues/modules/emit-socket-queue/emit-socket-queue.service';
import { EmitMessage } from 'src/common/dto/emit-message.dto';
import { WsGuard } from '../guard/guard.websocket';

@WebSocketGateway({ namespace: 'chat', path: `/realtime`, origin: '*' })
@UseGuards(WsGuard)
export class ChatGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  constructor(
    private readonly backendService: BackendService,
    private readonly redisService: RedisService,
    private readonly jwtCustomService: JwtCustomService,
    private readonly emitSocketQueueService: EmitSocketQueueService,
  ) {}

  @WebSocketServer() wss: Server; //* represent namespace Server

  //* LIFE CYCLE ---------------------------------------------------------------------
  afterInit() {
    return console.log('Socket Chat namespace init successful!');
  }

  private _verifyAccessToken(token: string): User {
    const user: User = this.jwtCustomService.decode(token);
    return user;
  }

  async handleConnection(client: Socket) {
    console.log('Client connected chat...: ' + client.id);

    //* get token from handshake and verify to get user
    const token: string = client.handshake.query['token'];
    const user: User = this._verifyAccessToken(token);

    if (!user) return;

    //* add current connection to redis
    this.redisService.getClient().sadd(`connections:${user?.id}`, client?.id);

    //* get all connections of user and check if connections.count = 0, emit online to all client in namespace
    const connections: string[] = await this.redisService
      .getClient()
      .smembers(`connections:${user?.id}`);

    if (connections.length === 1) client.broadcast.emit('connect_user', user);
  }

  async handleDisconnect(client: Socket) {
    console.log('Client disconnected chat...: ' + client.id);

    //* get token from handshake and verify to get user
    const token: string = client.handshake.query['token'];
    const user: User = this._verifyAccessToken(token);

    if (!user) return;

    //* remove current connection from user with client.id
    await this.redisService
      .getClient()
      .srem(`connections:${user?.id}`, client?.id);

    //* get all connections of user and check if list.count = 0, emit offline to all client in namespace
    const connections: string[] = await this.redisService
      .getClient()
      .smembers(`connections:${user?.id}`);

    if (connections.length === 0) this.wss.emit('disconnect_user', user);

    //* user -> rooms are connecting
    const roomId = await this.redisService
      .getClient()
      .hget(`rooms:${user?.id}`, client?.id);

    //* room -> users are connecting
    await this.redisService.getClient().hdel(`users:${roomId}`, client?.id);

    //* user -> rooms are connecting
    await this.redisService.getClient().hdel(`rooms:${user?.id}`, client?.id);
  }
  //* END LIFE CYCLE -----------------------------------------------------------------

  //* CUSTOM LISTENER ----------------------------------------------------------------
  @SubscribeMessage('join_room')
  async onJoinRoom(client: Socket, payload: any): Promise<any> {
    const user: User = client['user'];
    const roomId = payload.roomId; // roomId represent by conversationId in database

    //* save roomId (conversationId) for clientId
    client.join(roomId);

    //* room -> users are connecting
    await this.redisService
      .getClient()
      .hset(`users:${roomId}`, { [client.id]: user.id });

    //* user -> rooms are connecting
    await this.redisService
      .getClient()
      .hset(`rooms:${user.id}`, { [client.id]: roomId });

    //* check get all record of user in this room
    const connsInRoom: any = await this.redisService.getClient(); //* return object with multi key, not array.hgetall(`users:${roomId}`);

    //* check first time of user connect to this room
    if (
      Object.keys(connsInRoom).filter((key) => user.id === connsInRoom[key])
        .length === 1
    ) {
      //* notification for all client
      const data = {
        user: user,
        conversationId: roomId,
      };

      client.broadcast.emit('join_room', data);
    }

    //* get all user is connecting in this room
    const connections = await this.redisService
      .getClient()
      .hgetall(`users:${roomId}`);

    //* return users is connecting in room for client show how many is following this room
    return connections;
  }

  @SubscribeMessage('leave_room')
  async onLeaveRoom(client: Socket, payload: any): Promise<void> {
    const user: User = client['user'];
    const roomId = payload; // roomId represent by conversationId in database

    //* remove roomId (conversationId) for clientId
    client.leave(roomId);

    //* room -> users are connecting
    await this.redisService.getClient().hdel(`users:${roomId}`, client.id);
    // await this.redisService.getClient().hdel(`users:ff2a8da1-e7b5-4221-91a0-c05c88c8680c`, '/chat#m6JQgJnJSEGLdHG3AAAE');

    //* user -> rooms are connecting
    await this.redisService.getClient().hdel(`rooms:${user.id}`, client.id);

    //* check get all record of user in this room
    const userConnsInRoom: any = await this.redisService
      .getClient()
      .hgetall(`users:${roomId}`);

    if (
      Object.keys(userConnsInRoom).filter(
        (key) => user.id === userConnsInRoom[key],
      ).length === 0
    ) {
      //* notification for all client
      const data = {
        user: user,
        conversationId: roomId,
      };

      client.broadcast.emit('leave_room', data);
    }
  }

  @SubscribeMessage('send_message')
  async onSendMessage(client: Socket, payload: any): Promise<WsResponse<any>> {
    const { message, sender, signature } = payload;
    //TODO init data for attachments

    // them message moi vao database
    try {
      const messageAfterStore = await this.backendService.sendMessage({
        message,
        sender,
        signature,
      });

      // data tat ca connection dang join
      const newMessage = {
        //* property for identify message in state
        mode: messageAfterStore.mode, //TODO: normal | bulk | schedule
        exId: messageAfterStore.exId,
        exLastModifiedTime: messageAfterStore.exLastModifiedTime,
        companyCode: messageAfterStore.companyCode,

        //* property for state message
        id: messageAfterStore.id, //TODO: internal id
        text: messageAfterStore.text,
        attachments:
          messageAfterStore.attachments.length > 0
            ? messageAfterStore.attachments
            : [],
        direction: messageAfterStore.direction, //TODO: inbound | outbound
        sender: sender,
        creationTime: messageAfterStore.creationTime,
        exCreationTime: messageAfterStore.exCreationTime,
        exMessageStatus: messageAfterStore.exMessageStatus,
        messageStatus: messageAfterStore.messageStatus,
        conversationId: messageAfterStore.conversation.id,
        index: messageAfterStore.index,
        type: messageAfterStore.type,
      };

      const participantsOfConversation =
        await this.backendService.getUsersInConversation(
          message.conversationId,
        );
      const usersInConversation = participantsOfConversation.map(
        (item: any) => item.user.id,
      ); //=> [userId, userId, ...]

      //* tim tat ca connection cua tat ca user duoc add vao conversation
      const connectionsOfUsersPromise = usersInConversation.map((item: any) => {
        //TODO: ignore Promise
        return this.redisService.getClient().smembers(`connections:${item}`);
      });
      const connectionsOfUsers = await Promise.all(connectionsOfUsersPromise);
      //* chuyen tat ca connection cua tat ca user duoc add vao conversation vao 1 mang
      const connections = [];
      connectionsOfUsers.forEach((item: any) => connections.push(...item));

      //* emit den cac connection can nhan tinh hieu.
      this.emitSocketQueueService.preProcessMessageOutOfRoom({
        connectionsId: connections.filter((socketId) => socketId !== client.id), // loc ra cac connection can duoc nhan tinh hieu
        message: newMessage,
      });

      //* update umn cua cac conversation can nhan tinh hieu
      const updateUmnParticipants = participantsOfConversation.map(
        (item: any) => {
          if (item.user.id !== client['user'].id)
            return this.backendService.updateUmnWithNewMessage(item.id);
          else return this.backendService.readMessage(item.id);
        },
      );
      Promise.all(updateUmnParticipants);

      // emit den cac connection can nhan tinh hieu
      const event = 'send_message_success';
      return {
        event,
        data: {
          message: {
            ...newMessage,
            tempId: message.id,
          },
        },
      };
    } catch (error) {
      console.log(error);
      payload.message.messageStatus = 'error';
      delete payload.message['text'];
      this.wss.to(client.id).emit('send_error', payload);
    }
  }

  @SubscribeMessage('typing')
  async onTyping(client: Socket, payload: any) {
    const { roomId } = payload;

    client.broadcast.to(roomId).emit('typing', {
      user: `${payload.typingUser.firstName} ${payload.typingUser.lastName}`,
      roomId: roomId,
      value: payload.value,
    });
  }

  @SubscribeMessage('stop_typing')
  async onStopTyping(client: Socket, payload: any) {
    const { roomId } = payload;

    client.broadcast.to(roomId).emit('stop_typing', {
      user: `${payload.typingUser.firstName} ${payload.typingUser.lastName}`,
      roomId: roomId,
      value: payload.value,
    });
  }

  @SubscribeMessage('read_message')
  async onReadMessage(client: Socket, payload: any) {
    const user: User = client['user'];
    const userConnsInRoom: any = await this.redisService
      .getClient()
      .smembers(`connections:${user.id}`);

    for (let i = 0; i < userConnsInRoom.length; i++) {
      if (userConnsInRoom[i] !== client.id)
        this.wss.to(userConnsInRoom[i]).emit('read_message', payload);
    }

    await this.backendService.readMessage(payload.participantId);
  }
  //* END CUSTOM LISTENER ------------------------------------------------------------

  //* HANDLE LOGIC -------------------------------------------------------------------
  public handleInboundMessage(data: any) {
    //* notification to client is connecting room
    this.wss.to(data.roomId).emit('receive_message', {
      message: data.message.messages[0],
      isReceive: true,
    });

    //* notification to client is not connecting room
    for (let i = 0; i < data.listConnectionMiss.length; i++) {
      if (
        !data.listConnectionsInRoom.includes(
          data.listConnectionMiss[i].connection,
        )
      ) {
        this.wss
          .to(data.listConnectionMiss[i].connection)
          .emit('receive_message_another_room', data.message.messages[0]);
      }
    }

    return 'done';
  }

  public handleInboundCall(call: any) {
    //* get conversationId => roomId in off message
    const { conversationId: roomId } = call;

    //* notification to client is connecting room
    this.wss.to(roomId).emit('call', call);
  }

  public handleUpdateOutboundMessage(message: any) {
    const newMessage = {
      ...message,
      conversationId: message.conversation.id,
    };

    delete newMessage['conversation'];

    this.wss
      .to(message.conversation.id)
      .emit('update_outbound_message', { message: newMessage });
  }

  public emitEventMessageToConversationOfConnection(jobInfo: EmitMessage) {
    const { connectionIds, data, event } = jobInfo;

    connectionIds.forEach((socketId) => {
      this.wss.to(socketId).emit(event, { message: data });
    });
  }

  public emitReadMessage(data: any) {
    //* get connectionId => roomId in off message
    const { connectionId, conversationId, participantId, company } = data;

    //* notification to client is connecting
    this.wss.to(connectionId).emit('read_message', {
      conversationId,
      participantId,
      company,
    });
  }

  public emitCreateConversation(data: any) {
    this.wss.to(data.connectionId).emit('create_conversation', data.data);
  }

  public emitAuthError(data: any) {
    const { connectionId, payload } = data;

    //* notification to client is connecting
    this.wss.to(connectionId).emit('auth_error', {
      data: payload,
    });
  }
  //* END HANDLE LOGIC ---------------------------------------------------------------
}
