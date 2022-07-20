import { IoAdapter } from '@nestjs/platform-socket.io';
import * as redisAdapter from 'socket.io-redis';
import { RedisClient } from 'redis';
export class RedisIoAdapter extends IoAdapter {
  createIOServer(port: number, options?: any): any {
    const server = super.createIOServer(port, options);

    const pubClient = new RedisClient({
      host: process.env.RDS_HOST,
      port: +process.env.RDS_PORT,
      password: process.env.RDS_PASSWD,
    });

    const subClient = pubClient.duplicate();

    const adapter = redisAdapter({
      pubClient: pubClient,
      subClient: subClient,
    });

    server.adapter(adapter);
    return server;
  }
}
