import dotenv from 'dotenv';
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',

  // Temporal
  temporalAddress: process.env.TEMPORAL_ADDRESS || 'localhost:7233',
  temporalNamespace: process.env.TEMPORAL_NAMESPACE || 'default',
  temporalTaskQueue: process.env.TEMPORAL_TASK_QUEUE || 'HOTEL_OFFER_TASK_QUEUE',

  // Redis
  redisUrl: process.env.REDIS_URL,
  redisHost: process.env.REDIS_HOST || 'localhost',
  redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
  redisPassword: process.env.REDIS_PASSWORD || undefined,
  redisTtlSeconds: parseInt(process.env.REDIS_TTL_SECONDS || '3600', 10),

  // Suppliers
  supplierAUrl: process.env.SUPPLIER_A_URL || 'http://localhost:3000/supplierA/hotels',
  supplierBUrl: process.env.SUPPLIER_B_URL || 'http://localhost:3000/supplierB/hotels',
};
