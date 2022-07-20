import { Module } from '@nestjs/common';
import { LogActivityQueueModule } from './modules/log-activity-queue/log-activity-queue.module';
import { QueuesProvider } from './queues.provider';
import { EmitSocketQueueModule } from './modules/emit-socket-queue/emit-socket-queue.module';

@Module({
  imports: [LogActivityQueueModule, EmitSocketQueueModule],
  providers: [QueuesProvider],
})
export class QueuesModule {}
