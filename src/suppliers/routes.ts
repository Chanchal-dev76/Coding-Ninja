import { Router, Request, Response } from 'express';
import { supplierAHotels, supplierBHotels } from './mockData';
import { supplierState } from './state';
import { logger } from '../logger';

export const supplierRouter = Router();

// GET /supplierA/hotels
supplierRouter.get('/supplierA/hotels', (req: Request, res: Response) => {
  const failQuery = req.query.fail === 'true';
  if (!supplierState.isSupplierAHealthy() || failQuery) {
    logger.warn('Mock Supplier A received request while marked DOWN');
    return res.status(503).json({
      error: 'Supplier A is currently unavailable (Simulated Downtime)',
      supplier: 'Supplier A',
    });
  }

  const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : undefined;
  let results = supplierAHotels;

  if (city) {
    results = results.filter((hotel) => hotel.city.toLowerCase() === city);
  }

  return res.json(results);
});

// GET /supplierB/hotels
supplierRouter.get('/supplierB/hotels', (req: Request, res: Response) => {
  const failQuery = req.query.fail === 'true';
  if (!supplierState.isSupplierBHealthy() || failQuery) {
    logger.warn('Mock Supplier B received request while marked DOWN');
    return res.status(503).json({
      error: 'Supplier B is currently unavailable (Simulated Downtime)',
      supplier: 'Supplier B',
    });
  }

  const city = typeof req.query.city === 'string' ? req.query.city.trim().toLowerCase() : undefined;
  let results = supplierBHotels;

  if (city) {
    results = results.filter((hotel) => hotel.city.toLowerCase() === city);
  }

  return res.json(results);
});

// Simulation controls
supplierRouter.post('/supplierA/simulate-down', (req: Request, res: Response) => {
  const down = req.body?.down !== undefined ? Boolean(req.body.down) : true;
  supplierState.setSupplierAHealthy(!down);
  logger.info(`Supplier A health state toggled. Healthy: ${!down}`);
  return res.json({
    supplier: 'Supplier A',
    healthy: !down,
    message: !down ? 'Supplier A is now ONLINE' : 'Supplier A is now SIMULATED DOWN',
  });
});

supplierRouter.post('/supplierB/simulate-down', (req: Request, res: Response) => {
  const down = req.body?.down !== undefined ? Boolean(req.body.down) : true;
  supplierState.setSupplierBHealthy(!down);
  logger.info(`Supplier B health state toggled. Healthy: ${!down}`);
  return res.json({
    supplier: 'Supplier B',
    healthy: !down,
    message: !down ? 'Supplier B is now ONLINE' : 'Supplier B is now SIMULATED DOWN',
  });
});

supplierRouter.post('/suppliers/reset', (_req: Request, res: Response) => {
  supplierState.reset();
  logger.info('Reset both suppliers to healthy');
  return res.json({ message: 'Both suppliers reset to healthy' });
});
