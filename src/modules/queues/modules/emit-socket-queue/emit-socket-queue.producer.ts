import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class EmitSocketQueueProducer {
  constructor(
    @InjectQueue('emit-socket-queue')
    private readonly _emitSocketQueue: Queue,
  ) {}

  //* Message
  public async addEmitMessage(dataEmit: any) {
    this._emitSocketQueue.add('event_emit_to_connection', dataEmit, {
      attempts: 5,
      backoff: 10000,
      delay: 100,
      removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
      removeOnFail: false,
    });
  }

  public async handleReadMessage(dataEmit: any) {
    dataEmit.connectionsId.map((item: any) => {
      const dataJob = {
        connectionId: item,
        conversationId: dataEmit.conversationId,
        participantId: dataEmit.participantId,
        company: dataEmit.company,
      };

      this._emitSocketQueue.add('event_emit_read_message', dataJob, {
        attempts: 5,
        backoff: 10000,
        delay: 100,
        removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
        removeOnFail: false,
      });
    });
  }

  public async addEmitConversation(jobs: any) {
    jobs.forEach((job: any) => {
      this._emitSocketQueue.add('event_emit_conversation_to_connection', job, {
        attempts: 5,
        backoff: 10000,
        delay: 100,
        removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
        removeOnFail: false,
      });
    });
  }

  public async handleAuthError(dataEmit: any) {
    const dataJob = {
      connectionId: dataEmit.connectionId,
      payload: dataEmit.payload,
    };

    this._emitSocketQueue.add('auth_error', dataJob, {
      attempts: 5,
      backoff: 10000,
      delay: 100,
      removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
      removeOnFail: false,
    });
  }

  public async pushNotification(dataEmit: any) {
    this._emitSocketQueue.add(
      'event_emit_notification_to_connection',
      dataEmit,
      {
        attempts: 5,
        backoff: 10000,
        delay: 100,
        removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
        removeOnFail: false,
      },
    );
  }

  public addJobEmiUpdateConversation(
    connectionId: string,
    conversationUpdated: any,
    company: any,
  ) {
    this._emitSocketQueue.add(
      'event_emit_update_conversation',
      { connectionId, conversationUpdated, company },
      {
        attempts: 5,
        backoff: 10000,
        delay: 100,
        removeOnComplete: process.env.NODE_ENV === 'development' ? false : true,
        removeOnFail: false,
      },
    );
  }
}
