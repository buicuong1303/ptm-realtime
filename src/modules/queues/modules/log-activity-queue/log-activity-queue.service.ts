import { LogActivityQueueProducer } from './log-activity-queue.producer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class LogActivityQueueService {
  constructor(private readonly logActivityProducer: LogActivityQueueProducer) {}
}
