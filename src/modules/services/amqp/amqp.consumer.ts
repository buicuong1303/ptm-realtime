import { ChatService } from '../../chat/chat.service';
import { Injectable } from '@nestjs/common';
import { RabbitRPC, RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { NotificationService } from 'src/modules/notification/notification.service';

@Injectable()
export class AmqpConsumer {
  constructor(
    private readonly chatService: ChatService,
    private readonly notificationService: NotificationService,
  ) {}

  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'message.cmd.update_outbound_message.backend.realtime',
    queue:
      'phpswteam.php_text_message-message.cmd.update_outbound_message.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async updateOutboundMessage(payload: any) {
    this.chatService.handleUpdateOutboundMessage(payload);
  }

  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'message.cmd.update_outbound_list_messages.backend.realtime',
    queue:
      'phpswteam.php_text_message-message.cmd.update_outbound_list_messages.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async pubSubReceiveMessage(payload: any) {
    this.chatService.handleUpdateOutboundListMessages(payload);
  }

  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'message.cmd.create_outbound_list_messages.backend.realtime',
    queue:
      'phpswteam.php_text_message-message.cmd.create_outbound_list_messages.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async handleCreateOutBoundListMessage(payload: any) {
    this.chatService.handleCreateOutBoundListMessage(payload);
  }

  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'conversation.cmd.create.backend.realtime',
    queue:
      'phpswteam.php_text_message.conversation.cmd.create.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async handleCreateConversation(payload: any) {
    this.chatService.handleCreateConversation(payload);
  }

  @RabbitRPC({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'message.cmd.receive.backend.real_time',
    queue: 'phpswteam.php_text_message-message.cmd.receive.backend.real_time',
  })
  public async receiveMessageBackend(data: any) {
    if (data[0].conversation.isNew) {
      this.chatService.handleCreateConversation(data);
    } else {
      this.chatService.handleInboundMessage(data[0].conversation);
    }
  }

  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'notification.cmd.push_notification.backend.realtime',
    queue:
      'phpswteam.php_text_message.notification.cmd.push_notification.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async pushNotification(payload: any) {
    this.notificationService.pushNotification(payload);
  }

  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'schedule_message.cmd.track_schedule_message.backend.realtime',
    queue:
      'phpswteam.php_text_message.schedule_message.cmd.track_schedule_message.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async trackScheduleMessage(payload: any) {
    this.notificationService.trackScheduleMessage(payload);
  }
  @RabbitSubscribe({
    exchange: 'phpswteam.php_text_message',
    routingKey: 'call.cmd.receive_missed_inbound_call.backend.realtime',
    queue:
      'phpswteam.php_text_message-call.cmd.receive_missed_inbound_call.backend.realtime',
    queueOptions: {
      messageTtl: 5000,
    },
  })
  public async receiveMissedInboundCall(payload: any) {
    this.chatService.receiveMissedInboundCall(payload);
  }
}
