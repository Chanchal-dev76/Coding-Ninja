import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import RedisMock from 'ioredis-mock';
import { RedisService } from '../src/redis/client';
import { DeduplicatedHotel } from '../src/types/hotel';

describe('Redis Service Price Filtering', () => {
  let redisMock: any;
  let redisService: RedisService;

  const sampleHotels: DeduplicatedHotel[] = [
    { name: 'Budget Inn', price: 2500, supplier: 'Supplier A', commissionPct: 10 },
    { name: 'Holtin', price: 5340, supplier: 'Supplier B', commissionPct: 20 },
    { name: 'Radison', price: 5900, supplier: 'Supplier A', commissionPct: 13 },
    { name: 'Hyatt Regency', price: 7400, supplier: 'Supplier B', commissionPct: 14 },
    { name: 'Luxury Palace', price: 12000, supplier: 'Supplier A', commissionPct: 15 },
  ];

  beforeEach(async () => {
    redisMock = new RedisMock();
    await redisMock.flushall();
    redisService = new RedisService(redisMock as any);
  });

  afterEach(async () => {
    await redisService.disconnect();
  });

  it('should save hotels to Redis sorted set and retrieve all when no range is given', async () => {
    await redisService.saveHotels('delhi', sampleHotels);

    const results = await redisService.filterHotelsByPrice('delhi');
    expect(results).toHaveLength(5);
    expect(results[0].name).toBe('Budget Inn');
    expect(results[4].name).toBe('Luxury Palace');
  });

  it('should filter hotels with minPrice and maxPrice inside Redis', async () => {
    await redisService.saveHotels('delhi', sampleHotels);

    const results = await redisService.filterHotelsByPrice('delhi', 5000, 6000);
    expect(results).toHaveLength(2);
    expect(results.map((h) => h.name)).toEqual(['Holtin', 'Radison']);
  });

  it('should filter hotels with minPrice only', async () => {
    await redisService.saveHotels('delhi', sampleHotels);

    const results = await redisService.filterHotelsByPrice('delhi', 7000);
    expect(results).toHaveLength(2);
    expect(results.map((h) => h.name)).toEqual(['Hyatt Regency', 'Luxury Palace']);
  });

  it('should filter hotels with maxPrice only', async () => {
    await redisService.saveHotels('delhi', sampleHotels);

    const results = await redisService.filterHotelsByPrice('delhi', undefined, 5500);
    expect(results).toHaveLength(2);
    expect(results.map((h) => h.name)).toEqual(['Budget Inn', 'Holtin']);
  });

  it('should return empty list when no hotels fall in range', async () => {
    await redisService.saveHotels('delhi', sampleHotels);

    const results = await redisService.filterHotelsByPrice('delhi', 20000, 30000);
    expect(results).toEqual([]);
  });

  it('should check if city is cached', async () => {
    expect(await redisService.isCityCached('delhi')).toBe(false);
    await redisService.saveHotels('delhi', sampleHotels);
    expect(await redisService.isCityCached('delhi')).toBe(true);
  });
});
