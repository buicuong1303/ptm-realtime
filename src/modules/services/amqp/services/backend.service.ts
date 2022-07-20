import { AmqpProducer } from '../amqp.producer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class BackendService {
  constructor(private readonly amqpProducer: AmqpProducer) {}

  public sendMessage(data: any) {
    return this.amqpProducer.sendMessage(data);
  }

  public getUsersInConversation(conversationId: string) {
    return this.amqpProducer.getUsersInConversation(conversationId);
  }

  public getUsersWithParticipant(participantId: string) {
    return this.amqpProducer.getUsersWithParticipant(participantId);
  }

  public async updateUmnWithNewMessage(participantId: string) {
    return await this.amqpProducer.updateUmnWithNewMessage(participantId);
  }

  public async readMessage(participantId: string) {
    return await this.amqpProducer.readMessage(participantId);
  }

  public async updateUserOnlineStatus(user: any) {
    return await this.amqpProducer.updateUserOnlineStatus(user);
  }
}
