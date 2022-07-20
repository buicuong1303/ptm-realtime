import { Processor } from '@nestjs/bull';

@Processor('log-activity-queue')
export class LogActivityQueueConsumer {}
