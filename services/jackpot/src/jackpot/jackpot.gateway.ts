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
import { SocketEvents } from '@panda-ng/types';
import type { JackpotTickPayload, JackpotWinPayload } from '@panda-ng/types';

@WebSocketGateway({
  cors: {
    // Restrict to allowed origins from environment — never use wildcard with credentials
    origin: process.env['CORS_ORIGINS']?.split(',').map((o) => o.trim()) ?? ['http://localhost:3000'],
    credentials: true,
  },
  namespace: '/jackpot',
  transports: ['websocket', 'polling'],
})
export class JackpotGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(JackpotGateway.name);
  private connectedClients = 0;

  handleConnection(client: Socket): void {
    this.connectedClients++;
    this.logger.debug(`Client connected: ${client.id} | Total: ${this.connectedClients}`);
  }

  handleDisconnect(client: Socket): void {
    this.connectedClients--;
    this.logger.debug(`Client disconnected: ${client.id} | Total: ${this.connectedClients}`);
  }

  broadcastJackpotTick(payload: JackpotTickPayload): void {
    this.server.emit(SocketEvents.JACKPOT_TICK, payload);
  }

  broadcastJackpotWin(payload: JackpotWinPayload): void {
    this.server.emit(SocketEvents.JACKPOT_WIN, payload);
    this.logger.log(
      `Jackpot win broadcast: tier=${payload.tier} amount=${payload.win.amountInCents}`,
    );
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket): void {
    client.emit('pong', { timestamp: Date.now() });
  }
}
