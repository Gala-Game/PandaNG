import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

const PRESENCE_KEY = 'presence:online';
const PRESENCE_TTL = 300; // 5 minutes

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly redis: RedisService) {}

  async setOnline(userId: string, socketId: string): Promise<void> {
    await Promise.all([
      this.redis.sadd(PRESENCE_KEY, userId),
      this.redis.set(`presence:user:${userId}`, socketId, PRESENCE_TTL),
    ]);
  }

  async setOffline(userId: string): Promise<void> {
    await Promise.all([
      this.redis.srem(PRESENCE_KEY, userId),
      this.redis.del(`presence:user:${userId}`),
    ]);
  }

  async isOnline(userId: string): Promise<boolean> {
    const result = await this.redis.get(`presence:user:${userId}`);
    return result !== null;
  }

  async getOnlineCount(): Promise<number> {
    return this.redis.scard(PRESENCE_KEY);
  }

  async getOnlineUsers(): Promise<string[]> {
    return this.redis.smembers(PRESENCE_KEY);
  }
}
