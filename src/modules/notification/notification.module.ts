import { NotificationGateway } from './notification.gateway';
import { forwardRef, Module } from '@nestjs/common';
import { NotificationService } from './notification.service';
import { AmqpModule } from '../services/amqp/amqp.module';
import { EmitSocketQueueModule } from '../queues/modules/emit-socket-queue/emit-socket-queue.module';
import { JwtCustomModule } from '../jwt-custom/jwt-custom.module';

@Module({
  imports: [
    forwardRef(() => AmqpModule),
    JwtCustomModule,
    forwardRef(() => EmitSocketQueueModule),
  ],
  providers: [NotificationGateway, NotificationService],
  exports: [NotificationService],
})
export class NotificationModule {}
