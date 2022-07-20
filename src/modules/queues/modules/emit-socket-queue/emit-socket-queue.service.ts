import { Injectable } from '@nestjs/common';
import { EmitSocketQueueProducer } from './emit-socket-queue.producer';
import { EmitMessage } from 'src/common/dto/emit-message.dto';

@Injectable()
export class EmitSocketQueueService {
  constructor(private readonly _emitSocketProducer: EmitSocketQueueProducer) {}

  //* MESSAGE
  public addEmitMessage(dataEmit: EmitMessage) {
    return this._emitSocketProducer.addEmitMessage(dataEmit);
  }

  public preProcessMessageOutOfRoom(data: any) {
    // data cho tat ca connection can nhan tinh hieu
    const newDataForUpdateConversation = {
      mode: data.message.mode, //TODO: normal | bulk | schedule
      exId: data.message.exId,
      exLastModifiedTime: data.message.exLastModifiedTime,
      companyCode: data.message.companyCode,

      //* property for state message
      id: data.message.id, //TODO: internal id
      text: data.message.text,
      attachments:
        data.message.attachments.length > 0 ? data.message.attachments : [],
      direction: data.message.direction, //TODO: inbound | outbound
      sender: data.message.sender,
      creationTime: data.message.creationTime,
      exCreationTime: data.message.exCreationTime,
      exMessageStatus: data.message.exMessageStatus,
      messageStatus: data.message.messageStatus,
      conversationId: data.message.conversationId,
      type: data.message.type,
    };

    const jobInfo: EmitMessage = {
      connectionIds: data.connectionsId,
      data: newDataForUpdateConversation,
      event: 'send_message',
    };

    return this._emitSocketProducer.addEmitMessage(jobInfo);
  }

  public addEmitConversation(jobs: any) {
    return this._emitSocketProducer.addEmitConversation(jobs);
  }

  public handleReadMessage(dataEmit: any) {
    return this._emitSocketProducer.handleReadMessage(dataEmit);
  }

  public handleAuthError(dataEmit: any) {
    return this._emitSocketProducer.handleAuthError(dataEmit);
  }

  public pushNotification(dataEmit: EmitMessage) {
    return this._emitSocketProducer.pushNotification(dataEmit);
  }

  public emitUpdateConversation(
    connectionIds: string[],
    conversationUpdated: any,
    company: any,
  ) {
    connectionIds.map((conversationId) => {
      this._emitSocketProducer.addJobEmiUpdateConversation(
        conversationId,
        conversationUpdated,
        company,
      );
    });
  }
}
