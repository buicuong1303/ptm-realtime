import { ChatGateway } from './chat.gateway';
import { Logger, UseGuards } from '@nestjs/common';
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { RedisService } from 'nestjs-redis';
import { EmitSocketQueueService } from '../queues/modules/emit-socket-queue/emit-socket-queue.service';
import { EmitMessage } from 'src/common/dto/emit-message.dto';
import { WsGuard } from 'src/common/guard/websocket.guard';

@Injectable()
@UseGuards(WsGuard)
export class ChatService {
  constructor(
    @Inject(forwardRef(() => ChatGateway))
    private readonly chatGateWay: ChatGateway,
    private readonly redisService: RedisService,
    private readonly emitSocketQueueService: EmitSocketQueueService,
  ) {}

  private readonly logger = new Logger(ChatService.name);

  public async handleInboundMessage(conversation: any) {
    if (conversation.participants) {
      const participantLength = conversation.participants.length;

      for (let i = 0; i < participantLength; i++) {
        const connectsOfUser = await this.redisService
          .getClient()
          .smembers(`connections:${conversation.participants[i].user.id}`);

        const jobs: EmitMessage = {
          connectionIds: connectsOfUser,
          data: {
            ...conversation.messages[0],
          },
          event: 'receive_message',
        };
        this.emitSocketQueueService.addEmitMessage(jobs);
      }
    }
  }

  public handleInboundCall(message: any) {
    this.chatGateWay.handleInboundCall(message);
  }

  public handleUpdateOutboundListMessages(messages: any) {
    try {
      messages.forEach(async (message: any) => {
        const participantLength = message.participants.length;

        for (let j = 0; j < participantLength; j++) {
          const infoMessage = {
            mode: message.mode, //TODO: normal | bulk | schedule
            exId: message.exId,
            exLastModifiedTime: message.exLastModifiedTime,
            companyCode: message.companyCode,

            //* property for state message
            id: message.id, //TODO: internal id
            text: message.text,
            attachments: message.attachments ? message.attachments : [],
            direction: message.direction, //TODO: inbound | outbound
            sender: message.creationUserId
              ? {
                  id: message.creationUserId.id,
                  name:
                    message.creationUserId.firstName +
                    ' ' +
                    message.creationUserId.lastName,
                  email: message.creationUserId.email,
                  avatar: message.creationUserId.avatar,
                }
              : null,
            creationTime: message.creationTime,
            exCreationTime: message.exCreationTime,
            exMessageStatus: message.exMessageStatus,
            messageStatus: message.messageStatus,
            conversationId: message.conversation.id,
            index: message.index,
            type: message.type,
          };
          const connectsOfUser = await this.redisService
            .getClient()
            .smembers(`connections:${message.participants[j].user.id}`);

          const jobs: EmitMessage = {
            connectionIds: connectsOfUser,
            data: infoMessage,
            event: 'update_outbound_message',
          };

          this.emitSocketQueueService.addEmitMessage(jobs);
        }
      });
    } catch (error) {
      this.logger.error(error);
    }
  }

  public async handleUpdateOutboundMessage(payload: any) {
    const { message, participants } = payload;
    if (participants) {
      const participantLength = participants.length;

      for (let i = 0; i < participantLength; i++) {
        const connectsOfUser = await this.redisService
          .getClient()
          .smembers(`connections:${participants[i].user.id}`);

        const jobs: EmitMessage = {
          connectionIds: connectsOfUser,
          data: message,
          event: 'update_outbound_message',
        };
        this.emitSocketQueueService.addEmitMessage(jobs);
      }
    }
  }

  public handleCreateOutBoundListMessage(messages: any) {
    messages.forEach(async (message: any) => {
      const participantLength = message.participants.length;

      for (let j = 0; j < participantLength; j++) {
        const infoMessage = {
          mode: message.mode, //TODO: normal | bulk | schedule
          exId: message.exId,
          exLastModifiedTime: message.exLastModifiedTime,
          companyCode: message.companyCode,

          //* property for state message
          id: message.id, //TODO: internal id
          text: message.text,
          attachments:
            message.attachments.length > 0 ? message.attachments : [],
          direction: message.direction, //TODO: inbound | outbound
          sender: message.creationUserId
            ? {
                id: message.creationUserId.id,
                name:
                  message.creationUserId.firstName +
                  ' ' +
                  message.creationUserId.lastName,
                email: message.creationUserId.email,
                avatar: message.creationUserId.avatar,
              }
            : null,
          creationTime: message.creationTime,
          exCreationTime: message.exCreationTime,
          exMessageStatus: message.exMessageStatus,
          messageStatus: message.messageStatus,
          conversationId: message.conversation.id,
          index: message.index,
          type: message.type,
        };

        const connectsOfUser = await this.redisService
          .getClient()
          .smembers(
            `connections:${message.participants[j].companyUser.user.id}`,
          );

        const jobs: EmitMessage = {
          connectionIds: connectsOfUser,
          data: infoMessage,
          event: 'create_out_bound_message',
        };

        this.emitSocketQueueService.addEmitMessage(jobs);
      }
    });
  }

  public async handleCreateConversation(conversations: any) {
    try {
      for (let i = 0; i < conversations.length; i++) {
        const participantLength =
          conversations[i].conversation.participants.length;

        for (let j = 0; j < participantLength; j++) {
          const infoConversation = {
            ...conversations[i].conversation,
            participant: {
              participantId: conversations[i].conversation.participants[j].id,
              umn: conversations[i].conversation.participants[j].umn,
            },
          };

          delete infoConversation['participants'];

          const connectsOfUser = await this.redisService
            .getClient()
            .smembers(
              `connections:${conversations[i].conversation.participants[j].companyUser.user.id}`,
            );

          const jobs = connectsOfUser.map((connect) => ({
            connectionId: connect,
            data: infoConversation,
          }));

          this.emitSocketQueueService.addEmitConversation(jobs);
        }
      }
    } catch (error) {
      throw new Error('loi');
    }
  }

  public handleAuthError(connectionId: any, payload: any) {
    try {
      const job = {
        connectionId: connectionId,
        payload: payload,
      };

      this.emitSocketQueueService.handleAuthError(job);
    } catch (error) {
      throw new Error('loi');
    }
  }

  //* Received job from queue --------------------------------------------------------
  public emitReadMessage(data: any) {
    this.chatGateWay.emitReadMessage(data);
  }

  public emitEventCreateConversation(data: any) {
    this.chatGateWay.emitCreateConversation(data);
  }

  public emitEventMessageToConversationOfConnection(data: EmitMessage) {
    this.chatGateWay.emitEventMessageToConversationOfConnection(data);
  }

  public emitAuthError(data: any) {
    this.chatGateWay.emitAuthError(data);
  }

  public async receiveMissedInboundCall(data) {
    const { participants } = data;
    if (participants) {
      const participantLength = participants.length;

      for (let i = 0; i < participantLength; i++) {
        const infoMessage = {
          mode: data.mode, //TODO: normal | bulk | schedule
          exId: '',
          exLastModifiedTime: '',
          companyCode: data.companyCode,

          //* property for state message
          id: data.id, //TODO: internal id
          text: '',
          attachments: data.attachments,
          direction: data.direction, //TODO: inbound | outbound
          sender: data.creationUserId
            ? {
                id: data.creationUserId.id,
                name:
                  data.creationUserId.firstName +
                  ' ' +
                  data.creationUserId.lastName,
                email: data.creationUserId.email,
                avatar: data.creationUserId.avatar,
              }
            : null,
          creationTime: data.creationTime,
          exCreationTime: data.exCreationTime,
          exMessageStatus: data.exMessageStatus,
          messageStatus: data.messageStatus,
          conversationId: data.conversation.id,
          call: data.call,
          type: data.type,
        };
        const connectsOfUser = await this.redisService
          .getClient()
          .smembers(`connections:${participants[i].companyUser.user.id}`);

        const jobs: EmitMessage = {
          connectionIds: connectsOfUser,
          data: infoMessage,
          event: 'receive_missed_inbound_call',
        };
        this.emitSocketQueueService.addEmitMessage(jobs);
      }
    }
  }
}
