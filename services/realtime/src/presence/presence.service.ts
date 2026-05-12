import { Injectable, Logger } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';

// Sorted set key: member = userId, score = last-heartbeat Unix ms timestamp
const PRESENCE_ZSET_KEY = 'presence:online';
// Per-user TTL key with the socketId value (used as authoritative "is connected" signal)
const PRESENCE_TTL = 300; // seconds

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly redis: RedisService) {}

  async setOnline(userId: string, socketId: string): Promise<void> {
    await Promise.all([
      // Score = current timestamp so we can query active-within-TTL window
      this.redis.zadd(PRESENCE_ZSET_KEY, Date.now(), userId),
      // TTL key is the authoritative "is online" signal; expires on ungraceful disconnect
      this.redis.set(`presence:user:${userId}`, socketId, PRESENCE_TTL),
    ]);
  }

  async setOffline(userId: string): Promise<void> {
    await Promise.all([
      this.redis.zrem(PRESENCE_ZSET_KEY, userId),
      this.redis.del(`presence:user:${userId}`),
    ]);
  }

  async isOnline(userId: string): Promise<boolean> {
    // Derive from the TTL-backed key, not the sorted set, so ungraceful disconnects are caught
    const result = await this.redis.get(`presence:user:${userId}`);
    return result !== null;
  }

  async getOnlineCount(): Promise<number> {
    // Count only users who have a heartbeat within the TTL window
    const cutoff = Date.now() - PRESENCE_TTL * 1000;
    return this.redis.zcount(PRESENCE_ZSET_KEY, cutoff, '+inf');
  }

  async getOnlineUsers(): Promise<string[]> {
    // Return only users active within the TTL window
    const cutoff = Date.now() - PRESENCE_TTL * 1000;
    return this.redis.zrangebyscore(PRESENCE_ZSET_KEY, cutoff, '+inf');
  }
}
