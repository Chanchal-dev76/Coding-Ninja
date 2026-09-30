import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { supplierState } from '../src/suppliers/state';

describe('Mock Supplier Endpoints', () => {
  const app = createApp();

  beforeEach(() => {
    supplierState.reset();
  });

  it('GET /supplierA/hotels should return list with correct schema', async () => {
    const res = await request(app).get('/supplierA/hotels');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const first = res.body[0];
    expect(first).toHaveProperty('hotelId');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('city');
    expect(first).toHaveProperty('commissionPct');
  });

  it('GET /supplierB/hotels should return list with correct schema', async () => {
    const res = await request(app).get('/supplierB/hotels');
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body.length).toBeGreaterThan(0);

    const first = res.body[0];
    expect(first).toHaveProperty('hotelId');
    expect(first).toHaveProperty('name');
    expect(first).toHaveProperty('price');
    expect(first).toHaveProperty('city');
    expect(first).toHaveProperty('commissionPct');
  });

  it('should filter by city for supplier A', async () => {
    const res = await request(app).get('/supplierA/hotels?city=delhi');
    expect(res.status).toBe(200);
    expect(res.body.length).toBeGreaterThan(0);
    for (const h of res.body) {
      expect(h.city.toLowerCase()).toBe('delhi');
    }
  });

  it('should return empty array for unknown city', async () => {
    const res = await request(app).get('/supplierA/hotels?city=nonexistentcity');
    expect(res.status).toBe(200);
    expect(res.body).toEqual([]);
  });

  it('should simulate downtime when supplier A is set down', async () => {
    await request(app).post('/supplierA/simulate-down').send({ down: true });

    const res = await request(app).get('/supplierA/hotels');
    expect(res.status).toBe(503);
    expect(res.body.error).toContain('unavailable');

    // Supplier B should still be healthy
    const resB = await request(app).get('/supplierB/hotels');
    expect(resB.status).toBe(200);
  });

  it('should simulate downtime using fail query param', async () => {
    const res = await request(app).get('/supplierA/hotels?fail=true');
    expect(res.status).toBe(503);
  });
});
