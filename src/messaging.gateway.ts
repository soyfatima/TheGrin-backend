import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Message } from './message.entity';

@WebSocketGateway({ cors: true })
export class MessagingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private userSockets: Map<number, Socket> = new Map();

  handleConnection(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string, 10);
    if (userId) {
      this.userSockets.set(userId, client);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = parseInt(client.handshake.query.userId as string, 10);
    if (userId) {
      this.userSockets.delete(userId);
    }
  }

  notifyUser(userId: number, message: Message): void {
    const socket = this.userSockets.get(userId);
    if (socket) {
      socket.emit('newMessage', message);
    }
  }

  @SubscribeMessage('subscribeToMessages')
  handleSubscribeToMessages(client: Socket, @MessageBody() userId: number): void {
    client.join(`user_${userId}`);
  }
}
