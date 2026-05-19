import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

interface AuthenticatedSocket extends Socket {
  userId?: string;
}

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

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    this.connectedClients++;
    const token = this.extractToken(client);
    if (token) {
      try {
        const payload = await this.jwtService.verifyAsync<{ sub: string }>(token);
        client.userId = payload.sub;
        // Automatically join the authenticated user's room on connect
        await client.join(`user:${payload.sub}`);
        this.logger.debug(`Authenticated: user=${payload.sub} socket=${client.id}`);
      } catch {
        this.logger.warn(`Invalid JWT on connect: ${client.id} — disconnecting`);
        client.disconnect(true);
        return;
      }
    } else {
      this.logger.debug(`Unauthenticated connect: ${client.id} — disconnecting`);
      client.disconnect(true);
      return;
    }
    this.logger.debug(`Client connected: ${client.id} | Total: ${this.connectedClients}`);
  }

  handleDisconnect(client: AuthenticatedSocket): void {
    this.connectedClients--;
    this.logger.debug(`Client disconnected: ${client.id} | Total: ${this.connectedClients}`);
  }

  /**
   * Explicit re-join handler — useful if a client loses its room membership after a
   * brief disconnect/reconnect without a full socket teardown (e.g. transport upgrade).
   * On a clean connect, the room is already joined automatically in handleConnection.
   */
  @SubscribeMessage('join:user')
  handleJoinUser(@ConnectedSocket() client: AuthenticatedSocket): void {
    if (!client.userId) {
      client.disconnect(true);
      return;
    }
    void client.join(`user:${client.userId}`);
    this.logger.debug(`User ${client.userId} re-joined personal room`);
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
  handlePing(@ConnectedSocket() client: AuthenticatedSocket): void {
    client.emit('pong', { timestamp: Date.now() });
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as Record<string, unknown>;
    if (auth['token']) return auth['token'] as string;

    const authorization = client.handshake.headers['authorization'];
    if (authorization && typeof authorization === 'string') {
      return authorization.replace('Bearer ', '');
    }
    return null;
  }
}
