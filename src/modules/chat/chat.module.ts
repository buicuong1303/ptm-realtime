import { AmqpModule } from './../services/amqp/amqp.module';
import { ChatGateway } from './chat.gateway';
import { forwardRef, Global, Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtCustomModule } from '../jwt-custom/jwt-custom.module';
import { EmitSocketQueueModule } from '../queues/modules/emit-socket-queue/emit-socket-queue.module';

@Global()
@Module({
  imports: [
    forwardRef(() => AmqpModule),
    JwtCustomModule,
    forwardRef(() => EmitSocketQueueModule),
  ],
  providers: [ChatGateway, ChatService],
  exports: [ChatService],
})
export class ChatModule {}
