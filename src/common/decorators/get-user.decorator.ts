import { createParamDecorator } from '@nestjs/common';
import { Socket } from 'socket.io';

export const GetUser = createParamDecorator((data, ctx) => {
  const request: Socket = ctx.context.switchToWs().getClient();
  return request['user'];
});
