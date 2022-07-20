import { NotificationModule } from './modules/notification/notification.module';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './modules/chat/chat.module';
import { JwtCustomModule } from './modules/jwt-custom/jwt-custom.module';
import { AmqpModule } from './modules/services/amqp/amqp.module';
import { HttpModule } from './modules/services/http/http.module';
import { RedisModule } from 'nestjs-redis';

import { QueuesModule } from './modules/queues/queues.module';
import { redisQueueConfigAsync } from './common/config/redis-queue.config';
import { redisCacheConfigAsync } from './common/config/redis-cache.config';
import { BullModule } from '@nestjs/bull';

@Module({
  imports: [
    //* global module
    JwtCustomModule,
    //* normal module
    RedisModule.forRootAsync(redisCacheConfigAsync),
    AmqpModule,
    QueuesModule,
    ChatModule,
    NotificationModule,
    HttpModule,
    BullModule.forRootAsync(redisQueueConfigAsync),
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
