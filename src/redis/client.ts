import Redis, { Redis as RedisClientType } from 'ioredis';
import { config } from '../config/env';
import { DeduplicatedHotel } from '../types/hotel';
import { logger } from '../logger';

export class RedisService {
  private client: RedisClientType;
  private isConnected = false;

  constructor(customClient?: RedisClientType) {
    if (customClient) {
      this.client = customClient;
      this.isConnected = true;
    } else {
      const options = config.redisUrl
        ? config.redisUrl
        : {
            host: config.redisHost,
            port: config.redisPort,
            password: config.redisPassword,
            maxRetriesPerRequest: 3,
            retryStrategy(times: number) {
              const delay = Math.min(times * 100, 3000);
              return delay;
            },
            enableReadyCheck: true,
            lazyConnect: true,
          };

      this.client = new Redis(options as any);

      this.client.on('connect', () => {
        this.isConnected = true;
        logger.info('Connected to Redis');
      });

      this.client.on('error', (err) => {
        this.isConnected = false;
        logger.error({ err }, 'Redis connection error');
      });

      this.client.on('close', () => {
        this.isConnected = false;
        logger.warn('Redis connection closed');
      });

      // Attempt initial connection without blocking app startup
      this.client.connect().catch((err) => {
        logger.warn({ err: err.message }, 'Redis initial connection failed (will retry in background)');
      });
    }
  }

  public getRawClient(): RedisClientType {
    return this.client;
  }

  private getCityKey(city: string): string {
    return `hotels:city:${city.toLowerCase().trim()}`;
  }

  /**
   * Saves deduplicated hotels into a Redis Sorted Set (ZSET).
   * Score = hotel price, Member = JSON string of hotel object.
   */
  public async saveHotels(city: string, hotels: DeduplicatedHotel[]): Promise<void> {
    const key = this.getCityKey(city);
    try {
      const pipeline = this.client.pipeline();
      pipeline.del(key);

      if (hotels.length > 0) {
        for (const hotel of hotels) {
          pipeline.zadd(key, hotel.price, JSON.stringify(hotel));
        }
        pipeline.expire(key, config.redisTtlSeconds);
      } else {
        // Store an empty marker or short TTL key to prevent cache stampede on empty cities
        pipeline.set(`empty:${key}`, '1', 'EX', 300);
      }

      await pipeline.exec();
      logger.info(
        { city, count: hotels.length, key },
        'Saved deduplicated hotels to Redis Sorted Set'
      );
    } catch (error) {
      logger.error({ error, city }, 'Failed to save hotels to Redis');
      throw error;
    }
  }

  /**
   * Performs price range filtering directly inside Redis using ZRANGEBYSCORE.
   */
  public async filterHotelsByPrice(
    city: string,
    minPrice?: number,
    maxPrice?: number
  ): Promise<DeduplicatedHotel[]> {
    const key = this.getCityKey(city);
    const min = minPrice !== undefined ? minPrice : '-inf';
    const max = maxPrice !== undefined ? maxPrice : '+inf';

    try {
      // Redis ZRANGEBYSCORE returns members ordered by score (price) ascending
      const rawMembers = await this.client.zrangebyscore(key, min, max);

      const parsed: DeduplicatedHotel[] = rawMembers.map((str) => JSON.parse(str));
      logger.info(
        { city, minPrice, maxPrice, returnedCount: parsed.length },
        'Filtered hotels from Redis Sorted Set'
      );
      return parsed;
    } catch (error) {
      logger.error({ error, city, minPrice, maxPrice }, 'Error querying Redis for hotels');
      throw error;
    }
  }

  /**
   * Check if a city's results are present in Redis.
   */
  public async isCityCached(city: string): Promise<boolean> {
    const key = this.getCityKey(city);
    try {
      const exists = await this.client.exists(key);
      if (exists) return true;
      const emptyExists = await this.client.exists(`empty:${key}`);
      return emptyExists === 1;
    } catch {
      return false;
    }
  }

  /**
   * Check Redis health with round-trip latency.
   */
  public async checkHealth(): Promise<{ status: 'UP' | 'DOWN'; latencyMs?: number; message?: string }> {
    const start = Date.now();
    try {
      const pong = await this.client.ping();
      const latencyMs = Date.now() - start;
      if (pong === 'PONG') {
        return { status: 'UP', latencyMs };
      }
      return { status: 'DOWN', message: `Unexpected ping response: ${pong}`, latencyMs };
    } catch (err: any) {
      return { status: 'DOWN', message: err?.message || 'Redis unreachable' };
    }
  }

  public async disconnect(): Promise<void> {
    try {
      await this.client.quit();
    } catch {
      this.client.disconnect();
    }
  }
}

export const redisService = new RedisService();
