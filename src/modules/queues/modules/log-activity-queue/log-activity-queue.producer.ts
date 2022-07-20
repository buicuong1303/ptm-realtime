import { Injectable } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class LogActivityQueueProducer {
  constructor(
    @InjectQueue('log-activity-queue')
    private readonly logActivity: Queue,
  ) {}
}
