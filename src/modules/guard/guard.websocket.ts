import { checkExpirationToken } from 'src/common/utils/jwt';
import { JwtCustomService } from 'src/modules/jwt-custom/jwt-custom.service';
import { ChatService } from 'src/modules/chat/chat.service';
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  Inject,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import * as _ from 'lodash';
import { Socket } from 'socket.io';

@Injectable()
export class WsGuard implements CanActivate {
  constructor(
    @Inject('JwtCustomService')
    private readonly jwtCustomService: JwtCustomService,
    @Inject('ChatService')
    private readonly chatService: ChatService,
  ) {}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const client: Socket = context.switchToWs().getClient();
    const token = context['args'][0].handshake.query.token;

    const active = this.validateRequest(client, token);

    if (!active) this.chatService.handleAuthError(client.id, null);

    return active;
  }

  validateRequest(client: Socket, token: string): boolean {
    try {
      const payload = this.jwtCustomService.decode(token);

      if (!payload) return false;

      if (checkExpirationToken(payload['exp'])) return false;

      client['user'] = {
        ..._.pick(payload, ['id', 'name']),
        token,
      };

      return true;
    } catch (err) {
      return false;
    }
  }
}
