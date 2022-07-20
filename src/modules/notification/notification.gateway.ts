import { UseGuards } from '@nestjs/common';
import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { RedisService } from 'nestjs-redis';
import { Server, Socket } from 'socket.io';
import { WsGuard } from 'src/common/guard/websocket.guard';
import { User } from 'src/common/interfaces/user.interface';
import { JwtCustomService } from '../jwt-custom/jwt-custom.service';
import { BackendService } from '../services/amqp/services/backend.service';
import { OnlineStatus } from 'src/common/utils/online-status';
import { UpdateConversationDto } from './dto/update-conversation.dto';
import { EmitSocketQueueService } from '../queues/modules/emit-socket-queue/emit-socket-queue.service';
import * as _ from 'lodash';

@WebSocketGateway({ namespace: 'notification', path: `/realtime`, origin: '*' })
@UseGuards(WsGuard)
export class NotificationGateway {
  constructor(
    private readonly backendService: BackendService,
    private readonly redisService: RedisService,
    private readonly jwtCustomService: JwtCustomService,
    private readonly emitSocketQueueService: EmitSocketQueueService,
  ) {}

  @WebSocketServer() wss: Server; //* represent namespace Server

  //* LIFE CYCLE ---------------------------------------------------------------------
  afterInit() {
    return console.log('Socket Notification namespace init successful!');
  }

  @SubscribeMessage('update_conversations')
  async onUpdateConversations(
    client: Socket,
    payload: UpdateConversationDto,
  ): Promise<void> {
    if (payload.type === 'conversation') {
      payload?.conversationUpdated?.ids?.map((item: any) => {
        this._updateConversation(
          client.id,
          {
            ...payload.conversationUpdated,
            id: item,
          },
          payload.company,
        );
      });
    } else if (payload.type === 'participant') {
      payload?.conversationUpdated?.participants?.map((item: any) => {
        this._updateParticipant(
          client.id,
          {
            ..._.omit(payload.conversationUpdated, ['participants']),
            participant: item,
          },
          payload.company,
        );
      });
    }
  }

  @SubscribeMessage('update_conversation')
  async onUpdateConversation(
    client: Socket,
    payload: UpdateConversationDto,
  ): Promise<void> {
    if (payload.type === 'conversation') {
      this._updateConversation(
        client.id,
        payload.conversationUpdated,
        payload.company,
      );
    } else if (payload.type === 'participant') {
      this._updateParticipant(
        client.id,
        payload.conversationUpdated,
        payload.company,
      );
    }
  }

  private async _updateConversation(
    clientId: string,
    conversationUpdated: any,
    company: any,
  ) {
    const participants: [] = await this.backendService.getUsersInConversation(
      conversationUpdated.id,
    );

    //* user join to conversation
    const users = participants.map((item: any) => item.user.id); //=> [userId, userId, ...]

    //* get connection of users is connecting
    const connectionsPerUserPromise = users.map((item: any) => {
      //TODO: ignore Promise
      return this.redisService
        .getClient()
        .smembers(`connectionsRoomOnline:${item}`);
    });
    const connectionsPerUser = await Promise.all(connectionsPerUserPromise);

    //* convert connections per user to array connection
    const connections = [];
    connectionsPerUser.forEach((item: any) => connections.push(...item));

    //* emit
    const connectionIds = connections.filter(
      (socketId) => socketId !== clientId,
    );
    this.emitSocketQueueService.emitUpdateConversation(
      //* ignore current client
      connectionIds,
      conversationUpdated,
      company,
    );
  }

  private async _updateParticipant(
    clientId: string,
    conversationUpdated: any,
    company: any,
  ) {
    const participants: [] = await this.backendService.getUsersWithParticipant(
      conversationUpdated?.participant?.id,
    );

    //* user join to conversation
    const users = participants.map((item: any) => item.user.id); //=> [userId, userId, ...]

    //* get connection of users is connecting
    const connectionsPerUserPromise = users.map((item: any) => {
      //TODO: ignore Promise
      return this.redisService
        .getClient()
        .smembers(`connectionsRoomOnline:${item}`);
    });
    const connectionsPerUser = await Promise.all(connectionsPerUserPromise);

    //* convert connections per user to array connection
    const connections = [];
    connectionsPerUser.forEach((item: any) => connections.push(...item));

    //* emit
    const connectionIds = connections.filter(
      (socketId) => socketId !== clientId,
    );
    this.emitSocketQueueService.emitUpdateConversation(
      //* ignore current client
      connectionIds,
      conversationUpdated,
      company,
    );
  }

  public emitUpdateConversation(
    connectionId: string,
    conversationUpdated: any,
    company,
  ) {
    this.wss
      .to(connectionId)
      .emit('update_conversation', { conversationUpdated, company });
  }

  private _verifyAccessToken(token: string): User {
    const user: User = this.jwtCustomService.decode(token);
    return user;
  }

  async handleConnection(client: Socket) {
    console.log('Client connected notification...: ' + client.id);

    //* get token from handshake and verify to get user
    const token: string = client.handshake.query['token'];
    const user: User = this._verifyAccessToken(token);

    if (!user) return;

    const roomId = 'this_is_room_online';
    client.join(roomId);

    //* add current connection to redis
    this.redisService
      .getClient()
      .sadd(`connectionsRoomOnline:${user?.id}`, client?.id);

    //* get all connections of user and check if connections.count = 0, emit online to all client in namespace
    const connectionsOfUser: string[] = await this.redisService
      .getClient()
      .smembers(`connectionsRoomOnline:${user?.id}`);

    if (connectionsOfUser.length === 1) {
      user.onlineStatus = OnlineStatus.ONLINE;
      user.lastActivity = new Date();
      const userOnlineStatus = await this.backendService.updateUserOnlineStatus(
        user,
      );

      client.broadcast.emit('user_online', userOnlineStatus);
    }
  }

  async handleDisconnect(client: Socket) {
    console.log('Client disconnected notification...: ' + client.id);

    //* get token from handshake and verify to get user
    const token: string = client.handshake.query['token'];
    const user: User = this._verifyAccessToken(token);

    if (!user) return;

    const roomId = 'this_is_room_online';
    client.leave(roomId);

    //* remove current connection from user with client?.id
    await this.redisService
      .getClient()
      .srem(`connectionsRoomOnline:${user?.id}`, client?.id);

    //* get all connections of user and check if list.count = 0, emit offline to all client in namespace
    const connectionsOfUser: string[] = await this.redisService
      .getClient()
      .smembers(`connectionsRoomOnline:${user?.id}`);

    if (connectionsOfUser.length === 0) {
      user.onlineStatus = OnlineStatus.OFFLINE;
      user.lastActivity = new Date();
      const userOnlineStatus = await this.backendService.updateUserOnlineStatus(
        user,
      );

      client.broadcast.emit('user_offline', userOnlineStatus);
    }
  }

  public finishSendScheduleMessage(scheduleMessage: any) {
    // const { userId } = scheduleMessage;
    //* get all Access from userId to get all clientId
    const clientIds = [];

    for (let index = 0; index < clientIds.length; index++) {
      const clientId = clientIds[index];
      this.wss
        .of('/notification')
        .to(clientId)
        .emit('finish_schedule_message', scheduleMessage);
    }
  }

  public pushNotification(jobInfo: any) {
    const { connectionIds, data, event } = jobInfo;
    connectionIds.forEach((socketId: string) =>
      this.wss.to(socketId).emit(event, data),
    );
  }

  public async trackScheduleMessage({ users, data }) {
    let connections = [];
    for (const user of users) {
      const connectsOfUser = await this.redisService
        .getClient()
        .smembers(`connectionsRoomOnline:${user.id}`);
      connections = [...connections, ...connectsOfUser];
    }

    connections.forEach((socketId) =>
      this.wss.to(socketId).emit('track_schedule_message', data),
    );
  }
}
