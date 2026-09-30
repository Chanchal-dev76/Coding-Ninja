import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { supplierRouter } from './suppliers/routes';
import { hotelRouter } from './routes/hotels';
import { healthRouter } from './routes/health';
import { logger } from './logger';

export function createApp() {
  const app = express();

  // Basic Middlewares
  app.use(cors());
  app.use(express.json());

  // Request logging
  app.use((req: Request, _res: Response, next: NextFunction) => {
    logger.info({ method: req.method, url: req.url }, 'Incoming HTTP Request');
    next();
  });

  // Supplier routes (Mock Supplier APIs)
  app.use(supplierRouter);

  // Core API routes
  app.use('/api', hotelRouter);

  // Health check route
  app.use(healthRouter);

  // 404 handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({ error: 'Endpoint Not Found' });
  });

  // Global Error Handler
  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    logger.error({ err }, 'Unhandled application error');
    res.status(500).json({
      error: 'Internal Server Error',
      message: err.message || 'An unexpected error occurred',
    });
  });

  return app;
}
