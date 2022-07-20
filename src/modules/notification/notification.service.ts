import { Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { EmitMessage } from 'src/common/dto/emit-message.dto';
import { EmitSocketQueueService } from '../queues/modules/emit-socket-queue/emit-socket-queue.service';
import { NotificationGateway } from './notification.gateway';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationGateWay: NotificationGateway,
    private redisService: RedisService,
    private readonly emitSocketQueueService: EmitSocketQueueService,
  ) {}

  public async pushNotification(payload) {
    const { data, notificationReceivers } = payload;
    const notificationReceiversLength = notificationReceivers.length;

    for (let i = 0; i < notificationReceiversLength; i++) {
      const connectsOfUser = await this.redisService
        .getClient()
        .smembers(
          `connectionsRoomOnline:${notificationReceivers[i].receiver.id}`,
        );

      const jobs: EmitMessage = {
        connectionIds: connectsOfUser,
        data: {
          content: data.content,
          type: data.type,
          createdAt: data.createdAt,
          id: notificationReceivers[i].id,
          readStatus: data.readStatus,
        },
        event: 'push_notification',
      };

      this.emitSocketQueueService.pushNotification(jobs);
    }
  }

  public async trackScheduleMessage(payload) {
    this.notificationGateWay.trackScheduleMessage({
      users: payload.notificationReceivers,
      data: payload.data,
    });
  }

  public emitEventNotificationToReceiverOfConnection(data: EmitMessage) {
    this.notificationGateWay.pushNotification(data);
  }

  public emitConversationUpdated(
    connectionId: string,
    conversationUpdated: any,
    company,
  ) {
    this.notificationGateWay.emitUpdateConversation(
      connectionId,
      conversationUpdated,
      company,
    );
  }
}
