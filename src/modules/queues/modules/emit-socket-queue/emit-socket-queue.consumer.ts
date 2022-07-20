import { ChatService } from 'src/modules/chat/chat.service';
import { Processor, Process } from '@nestjs/bull';
import { Job } from 'bull';
import { NotificationService } from 'src/modules/notification/notification.service';

@Processor('emit-socket-queue')
export class EmitSocketQueueConsumer {
  constructor(
    private readonly _chatService: ChatService,
    private readonly _notificationService: NotificationService,
  ) {}

  //* MESSAGE
  @Process('event_emit_to_connection')
  async executeSendMessage(job: Job<any>): Promise<any> {
    this._chatService.emitEventMessageToConversationOfConnection(job.data);
  }

  @Process('event_emit_conversation_to_connection')
  async executeCreateConversation(job: Job<any>): Promise<any> {
    this._chatService.emitEventCreateConversation(job.data);
  }

  @Process('event_emit_read_message')
  async executeUpdateUmn(job: Job<any>): Promise<any> {
    this._chatService.emitReadMessage(job.data);
  }

  @Process('auth_error')
  async executeAuthError(job: Job<any>): Promise<any> {
    this._chatService.emitAuthError(job.data);
  }

  @Process('event_emit_notification_to_connection')
  async executePushNotification(job: Job<any>): Promise<any> {
    this._notificationService.emitEventNotificationToReceiverOfConnection(
      job.data,
    );
  }

  @Process('event_emit_update_conversation')
  async executeEmitUpdateConversation(job: Job<any>): Promise<any> {
    const { connectionId, conversationUpdated, company } = job.data;
    this._notificationService.emitConversationUpdated(
      connectionId,
      conversationUpdated,
      company,
    );
  }
}
