import { EmitSocketQueueConsumer } from './emit-socket-queue.consumer';
import { BullModule } from '@nestjs/bull';
import { Module, Global, forwardRef } from '@nestjs/common';
import { ChatModule } from 'src/modules/chat/chat.module';
import { EmitSocketQueueProducer } from './emit-socket-queue.producer';
import { EmitSocketQueueService } from './emit-socket-queue.service';
import { NotificationModule } from 'src/modules/notification/notification.module';

@Global()
@Module({
  imports: [
    forwardRef(() => ChatModule),
    forwardRef(() => NotificationModule),
    BullModule.registerQueue({
      name: 'emit-socket-queue',
    }),
  ],
  providers: [
    EmitSocketQueueProducer,
    EmitSocketQueueConsumer,
    EmitSocketQueueService,
  ],
  exports: [EmitSocketQueueService, BullModule],
})
export class EmitSocketQueueModule {}
