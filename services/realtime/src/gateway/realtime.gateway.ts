import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, OnModuleInit } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PresenceService } from '../presence/presence.service';
import { RedisService } from '../redis/redis.service';
import { SocketEvents } from '@panda-ng/types';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  username?: string;
}

@WebSocketGateway({
  cors: {
    origin: (process.env['CORS_ORIGINS'] ?? 'http://localhost:3000').split(','),
    credentials: true,
  },
  transports: ['websocket', 'polling'],
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class RealtimeGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect, OnModuleInit
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(RealtimeGateway.name);

  constructor(
    private readonly jwtService: JwtService,
    private readonly presence: PresenceService,
    private readonly redis: RedisService,
  ) {}

  async onModuleInit(): Promise<void> {
    // Subscribe to Redis channels for cross-node event fanout
    await this.redis.subscribe('jackpot:win', (message) => {
      this.server.emit(SocketEvents.JACKPOT_WIN, JSON.parse(message) as object);
    });

    await this.redis.subscribe('winner:announce', (message) => {
      this.server.emit(SocketEvents.WINNER_ANNOUNCE, JSON.parse(message) as object);
    });

    await this.redis.subscribe('leaderboard:update', (message) => {
      this.server.emit(SocketEvents.LEADERBOARD_UPDATE, JSON.parse(message) as object);
    });

    await this.redis.subscribe('clan:update', (message) => {
      this.server.emit(SocketEvents.CLAN_UPDATE, JSON.parse(message) as object);
    });

    this.logger.log('Redis pub/sub subscriptions active');
  }

  afterInit(_server: Server): void {
    this.logger.log('WebSocket gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket): Promise<void> {
    try {
      const token = this.extractToken(client);
      if (token) {
        const payload = await this.jwtService.verifyAsync<{ sub: string; email: string }>(token);
        client.userId = payload.sub;
        client.username = payload.email;
        await this.presence.setOnline(payload.sub, client.id);
        // Join user-specific room for targeted messages
        await client.join(`user:${payload.sub}`);
        this.logger.debug(`Authenticated connection: ${payload.sub} (${client.id})`);
      } else {
        this.logger.debug(`Anonymous connection: ${client.id}`);
      }

      const onlineCount = await this.presence.getOnlineCount();
      client.emit(SocketEvents.ONLINE_COUNT, { count: onlineCount });
    } catch {
      this.logger.warn(`Connection auth failed: ${client.id} — continuing as anonymous`);
      // Allow anonymous users to view jackpots/leaderboards
    }
  }

  async handleDisconnect(client: AuthenticatedSocket): Promise<void> {
    if (client.userId) {
      await this.presence.setOffline(client.userId);
    }
    this.logger.debug(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage(SocketEvents.JOIN_ROOM)
  async handleJoinRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): Promise<void> {
    await client.join(data.room);
    this.logger.debug(`Client ${client.id} joined room: ${data.room}`);
  }

  @SubscribeMessage(SocketEvents.LEAVE_ROOM)
  async handleLeaveRoom(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { room: string },
  ): Promise<void> {
    await client.leave(data.room);
  }

  broadcastToRoom(room: string, event: SocketEvents, data: unknown): void {
    this.server.to(room).emit(event, data);
  }

  broadcastAll(event: SocketEvents, data: unknown): void {
    this.server.emit(event, data);
  }

  sendToUser(userId: string, event: SocketEvents, data: unknown): void {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  private extractToken(client: Socket): string | null {
    const auth = client.handshake.auth as Record<string, unknown>;
    if (auth['token']) return auth['token'] as string;

    const headers = client.handshake.headers;
    const authorization = headers['authorization'];
    if (authorization && typeof authorization === 'string') {
      return authorization.replace('Bearer ', '');
    }
    return null;
  }
}
