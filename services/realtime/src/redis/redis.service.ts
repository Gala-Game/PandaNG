import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  subscriber!: Redis;
  publisher!: Redis;
  client!: Redis;

  // Single shared handler map: channel → list of callbacks
  // Prevents multiple 'message' listeners from being registered on repeated subscribe() calls
  private readonly channelHandlers = new Map<string, Array<(message: string) => void>>();
  private messageHandlerAttached = false;

  constructor(private readonly config: ConfigService) {}

  async onModuleInit(): Promise<void> {
    const url = this.config.getOrThrow<string>('REDIS_URL');
    this.client = new Redis(url, { lazyConnect: true });
    this.publisher = new Redis(url, { lazyConnect: true });
    this.subscriber = new Redis(url, { lazyConnect: true });
    await Promise.all([
      this.client.connect(),
      this.publisher.connect(),
      this.subscriber.connect(),
    ]);
    this.logger.log('Redis connected (3 connections: client, pub, sub)');
  }

  async onModuleDestroy(): Promise<void> {
    await Promise.all([this.client.quit(), this.publisher.quit(), this.subscriber.quit()]);
  }

  async set(key: string, value: string, ttl?: number): Promise<void> {
    if (ttl) await this.client.set(key, value, 'EX', ttl);
    else await this.client.set(key, value);
  }

  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    await this.client.del(key);
  }

  async sadd(key: string, ...members: string[]): Promise<void> {
    await this.client.sadd(key, ...members);
  }

  async srem(key: string, member: string): Promise<void> {
    await this.client.srem(key, member);
  }

  async smembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async scard(key: string): Promise<number> {
    return this.client.scard(key);
  }

  // Sorted set helpers for TTL-aware presence tracking
  async zadd(key: string, score: number, member: string): Promise<void> {
    await this.client.zadd(key, score, member);
  }

  async zrem(key: string, member: string): Promise<void> {
    await this.client.zrem(key, member);
  }

  async zcount(key: string, min: number | '-inf', max: number | '+inf'): Promise<number> {
    return this.client.zcount(key, min, max);
  }

  async zrangebyscore(
    key: string,
    min: number | '-inf',
    max: number | '+inf',
  ): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  async publish(channel: string, message: string): Promise<void> {
    await this.publisher.publish(channel, message);
  }

  async subscribe(channel: string, handler: (message: string) => void): Promise<void> {
    await this.subscriber.subscribe(channel);

    // Register handler in the shared map
    const handlers = this.channelHandlers.get(channel) ?? [];
    handlers.push(handler);
    this.channelHandlers.set(channel, handlers);

    // Attach the single shared 'message' listener only once
    if (!this.messageHandlerAttached) {
      this.subscriber.on('message', (ch: string, msg: string) => {
        const chHandlers = this.channelHandlers.get(ch);
        if (chHandlers) {
          for (const h of chHandlers) h(msg);
        }
      });
      this.messageHandlerAttached = true;
    }
  }
}
