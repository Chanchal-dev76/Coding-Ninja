import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import request from 'supertest';
import RedisMock from 'ioredis-mock';
import { createApp } from '../src/app';
import { redisService } from '../src/redis/client';
import { supplierState } from '../src/suppliers/state';
import { orchestratorService } from '../src/services/orchestrator';

import { config } from '../src/config/env';
import { temporalClientManager } from '../src/temporal/client';

process.env.NODE_ENV = 'test';
config.nodeEnv = 'test';

describe('Hotel Orchestrator API Endpoints', () => {
  const app = createApp();
  let redisMock: any;

  beforeEach(async () => {
    redisMock = new RedisMock();
    await redisMock.flushall();
    // Swap internal Redis client with mock for deterministic testing
    (redisService as any).client = redisMock;
    (redisService as any).isConnected = true;
    supplierState.reset();

    vi.spyOn(temporalClientManager, 'checkHealth').mockResolvedValue({
      status: 'UP',
      latencyMs: 1,
    });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('GET / should return 200 and the HTML landing page', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('Hotel Offer Orchestrator');
    expect(res.text).toContain('Temporal.io');
  });

  it('GET /api/hotels without city should return 400 Bad Request', async () => {
    const res = await request(app).get('/api/hotels');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
    expect(res.body.details[0].field).toBe('city');
  });

  it('GET /api/hotels with minPrice > maxPrice should return 400 Bad Request', async () => {
    const res = await request(app).get('/api/hotels?city=delhi&minPrice=7000&maxPrice=5000');
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Invalid query parameters');
    expect(res.body.details[0].message).toContain('maxPrice must be greater than or equal to minPrice');
  });

  it('GET /api/hotels?city=delhi should orchestrate, deduplicate, and return best offers', async () => {
    const res = await request(app).get('/api/hotels?city=delhi');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // Verify expected structure
    const holtin = res.body.find((h: any) => h.name === 'Holtin');
    expect(holtin).toBeDefined();
    // Holtin in A: 6000, comm 10. In B: 5340, comm 20. Supplier B wins!
    expect(holtin.price).toBe(5340);
    expect(holtin.supplier).toBe('Supplier B');
    expect(holtin.commissionPct).toBe(20);

    // Radison in A: 5900, comm 13. In B: 6200, comm 11. Supplier A wins!
    const radison = res.body.find((h: any) => h.name === 'Radison');
    expect(radison).toBeDefined();
    expect(radison.price).toBe(5900);
    expect(radison.supplier).toBe('Supplier A');
    expect(radison.commissionPct).toBe(13);
  });

  it('GET /api/hotels?city=delhi&minPrice=5000&maxPrice=5500 should filter results inside Redis', async () => {
    const res = await request(app).get('/api/hotels?city=delhi&minPrice=5000&maxPrice=5500');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);

    for (const hotel of res.body) {
      expect(hotel.price).toBeGreaterThanOrEqual(5000);
      expect(hotel.price).toBeLessThanOrEqual(5500);
    }
  });

  it('GET /api/hotels for city with no results should return empty array', async () => {
    const res = await request(app).get('/api/hotels?city=atlantis');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('GET /health should return system and supplier health report', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('status');
    expect(res.body).toHaveProperty('timestamp');
    expect(res.body).toHaveProperty('services');
    expect(res.body.services).toHaveProperty('supplierA');
    expect(res.body.services).toHaveProperty('supplierB');
    expect(res.body.services).toHaveProperty('redis');
    expect(res.body.services).toHaveProperty('temporal');
  });

  it('GET /health should report DEGRADED when Supplier A is simulated down', async () => {
    supplierState.setSupplierAHealthy(false);

    const res = await request(app).get('/health');
    expect(res.body.status).toBe('DEGRADED');
    expect(res.body.services.supplierA.status).toBe('DOWN');
    expect(res.body.services.supplierB.status).toBe('UP');
  });

  it('should continue to serve hotels from Supplier B when Supplier A is down', async () => {
    supplierState.setSupplierAHealthy(false);

    const res = await request(app).get('/api/hotels?city=delhi&fresh=true');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    // All returned hotels should be from Supplier B
    for (const h of res.body) {
      expect(h.supplier).toBe('Supplier B');
    }
  });
});
