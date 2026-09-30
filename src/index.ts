import { createApp } from './app';
import { config } from './config/env';
import { logger } from './logger';
import { runWorker } from './temporal/worker';
import { redisService } from './redis/client';

async function bootstrap() {
  const app = createApp();

  const server = app.listen(config.port, () => {
    logger.info(`Hotel Offer Orchestrator running on port ${config.port}`);
    logger.info(`Mock Supplier A: http://localhost:${config.port}/supplierA/hotels`);
    logger.info(`Mock Supplier B: http://localhost:${config.port}/supplierB/hotels`);
    logger.info(`Hotel API: http://localhost:${config.port}/api/hotels?city=delhi`);
    logger.info(`Health Check: http://localhost:${config.port}/health`);
  });

  // Start Temporal Worker in background if not explicitly disabled
  if (process.env.RUN_WORKER !== 'false') {
    logger.info('Initializing Temporal Worker in background...');
    runWorker().catch((err) => {
      logger.warn(
        { err: err.message },
        'Temporal worker could not connect immediately (will be retried or direct fallback will be used)'
      );
    });
  }

  // Graceful shutdown
  const shutdown = async () => {
    logger.info('Shutting down server...');
    server.close(async () => {
      await redisService.disconnect();
      logger.info('Server gracefully terminated');
      process.exit(0);
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

bootstrap().catch((err) => {
  logger.error({ err }, 'Fatal startup error');
  process.exit(1);
});
