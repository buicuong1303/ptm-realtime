import { Module, Global } from '@nestjs/common';
import { ChatService } from '../chat/chat.service';

@Global()
@Module({
  imports: [],
  providers: [ChatService],
  exports: [ChatService],
})
export class GuardModule {}
