import { LogActivityQueueConsumer } from './log-activity-queue.consumer';
import { BullModule } from '@nestjs/bull';
import { Module, Global } from '@nestjs/common';
import { LogActivityQueueService } from './log-activity-queue.service';
import { LogActivityQueueProducer } from './log-activity-queue.producer';

@Global()
@Module({
  imports: [
    BullModule.registerQueue({
      name: 'log-activity-queue',
    }),
  ],
  providers: [
    LogActivityQueueProducer,
    LogActivityQueueConsumer,
    LogActivityQueueService,
  ],
  exports: [LogActivityQueueService, BullModule],
})
export class LogActivityQueueModule {}
