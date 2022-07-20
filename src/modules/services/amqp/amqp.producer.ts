import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';

@Injectable()
export class AmqpProducer {
  constructor(private readonly _amqpConnection: AmqpConnection) {}

  public async sendMessage(data: any) {
    try {
      const response = await this._amqpConnection.request<any>({
        exchange: 'phpswteam.php_text_message',
        routingKey: 'message.cmd.send.real_time.backend',
        payload: {
          request: data,
        },
        timeout: 10000, // optional timeout for how long the request
        // should wait before failing if no response is received
      });
      return response;
    } catch (error) {
      console.log(error);
      throw new InternalServerErrorException();
    }
  }

  public async getUsersInConversation(conversationId: string) {
    const response = await this._amqpConnection.request<any>({
      exchange: 'phpswteam.php_text_message',
      routingKey: 'user.cmd.get.real_time.backend',
      payload: conversationId,
      timeout: 10000, // optional timeout for how long the request
      // should wait before failing if no response is received
    });
    return response;
  }

  public async getUsersWithParticipant(participantId: string) {
    const response = await this._amqpConnection.request<any>({
      exchange: 'phpswteam.php_text_message',
      routingKey: 'participant.cmd.get.real_time.backend',
      payload: participantId,
      timeout: 10000, // optional timeout for how long the request
      // should wait before failing if no response is received
    });
    return response;
  }

  public async updateUmnWithNewMessage(participantId: string) {
    const response = await this._amqpConnection.request<any>({
      exchange: 'phpswteam.php_text_message',
      routingKey: 'participant.cmd.update_umn.real_time.backend',
      payload: participantId,
      timeout: 10000, // optional timeout for how long the request
      // should wait before failing if no response is received
    });

    return response;
  }

  public async readMessage(participantId: string) {
    const response = await this._amqpConnection.request<any>({
      exchange: 'phpswteam.php_text_message',
      routingKey: 'participant.cmd.update_umn_read.real_time.backend',
      payload: participantId,
      timeout: 10000, // optional timeout for how long the request
      // should wait before failing if no response is received
    });

    return response;
  }

  public async updateUserOnlineStatus(participantId: string) {
    const response = await this._amqpConnection.request<any>({
      exchange: 'phpswteam.php_text_message',
      routingKey: 'user.cmd.update_online_status.real_time.backend',
      payload: participantId,
      timeout: 10000, // optional timeout for how long the request
      // should wait before failing if no response is received
    });

    return response;
  }
}
