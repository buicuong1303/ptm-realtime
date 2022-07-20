import { ChatModule } from 'src/modules/chat/chat.module';
import { AmqpConsumer } from './amqp.consumer';
import { AmqpProducer } from './amqp.producer';
import { forwardRef, Module } from '@nestjs/common';
import { BackendService } from './services/backend.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { NotificationModule } from 'src/modules/notification/notification.module';
import { rabbitMqConfigAsync } from 'src/common/config/rabbitmq.config';

@Module({
  imports: [
    RabbitMQModule.forRootAsync(RabbitMQModule, rabbitMqConfigAsync),
    forwardRef(() => ChatModule),
    forwardRef(() => NotificationModule),
  ],
  providers: [AmqpProducer, AmqpConsumer, BackendService],
  exports: [BackendService],
})
export class AmqpModule {}
