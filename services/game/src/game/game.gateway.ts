import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: process.env['CORS_ORIGINS']?.split(',').map((o) => o.trim()) ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/game',
  transports: ['websocket', 'polling'],
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(GameGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket): void {
    this.connectedClients++;
    this.logger.debug(`Client connected: ${client.id} | Total: ${this.connectedClients}`);
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients--;
    this.logger.debug(`Client disconnected: ${client.id} | Total: ${this.connectedClients}`);
  }

  /** Player joins their personal room to receive private game outcomes */
  @SubscribeMessage('join:user')
  handleJoinUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { userId: string },
  ): void {
    void client.join(`user:${data.userId}`);
    this.logger.debug(`User ${data.userId} joined personal room`);
  }

  /** Emit game result to a specific user's room */
  emitGameResult(userId: string, payload: Record<string, unknown>): void {
    this.server.to(`user:${userId}`).emit('game:result', payload);
  }

  /** Broadcast to all connected clients (e.g. big wins) */
  broadcastBigWin(payload: Record<string, unknown>): void {
    this.server.emit('game:big-win', payload);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }
}
