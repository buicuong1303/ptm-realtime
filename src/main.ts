import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { RedisIoAdapter } from './common/adapters/redis.adapter';
import { router as BullBoardUI } from 'bull-board';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('bootstrap');
  const port = process.env.PORT;
  logger.log(`Application run on port: ${port}`);

  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix(`${process.env.PREFIX_PATH}`);

  //* implement redis adapter to handle multiple instance socket server
  app.useWebSocketAdapter(new RedisIoAdapter(app));

  //* bull queue monitoring
  app.use('/queues/monitoring-ui', BullBoardUI);

  await app.listen(port);
}
bootstrap();
