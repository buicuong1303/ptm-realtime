import { InjectQueue } from '@nestjs/bull';
import { Injectable } from '@nestjs/common';
import { setQueues, BullMQAdapter } from 'bull-board';
import { Queue as QueueMQ } from 'bullmq';

@Injectable()
export class QueuesProvider {
  constructor(
    @InjectQueue('log-activity-queue')
    private readonly logActivityQueue: QueueMQ,
    @InjectQueue('emit-socket-queue')
    private readonly EmitSocketQueue: QueueMQ,
  ) {
    this._setupBullQueueMonitoring();
  }

  private _setupBullQueueMonitoring = () => {
    const bullMQAdapters: BullMQAdapter[] = [
      new BullMQAdapter(this.logActivityQueue),
      new BullMQAdapter(this.EmitSocketQueue),
    ];

    setQueues(bullMQAdapters);
  };
}
