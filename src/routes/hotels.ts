import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { orchestratorService } from '../services/orchestrator';
import { logger } from '../logger';

export const hotelRouter = Router();

const querySchema = z
  .object({
    city: z
      .string({ required_error: 'Query parameter "city" is required' })
      .min(1, 'Query parameter "city" cannot be empty'),
    minPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'minPrice must be a valid number')
      .transform(Number)
      .refine((val) => val >= 0, 'minPrice must be non-negative')
      .optional(),
    maxPrice: z
      .string()
      .regex(/^\d+(\.\d+)?$/, 'maxPrice must be a valid number')
      .transform(Number)
      .refine((val) => val >= 0, 'maxPrice must be non-negative')
      .optional(),
    fresh: z
      .enum(['true', 'false'])
      .transform((val) => val === 'true')
      .optional(),
  })
  .refine(
    (data) => {
      if (data.minPrice !== undefined && data.maxPrice !== undefined) {
        return data.maxPrice >= data.minPrice;
      }
      return true;
    },
    {
      message: 'maxPrice must be greater than or equal to minPrice',
      path: ['maxPrice'],
    }
  );

// GET /api/hotels?city=delhi&minPrice=<min>&maxPrice=<max>
hotelRouter.get('/hotels', async (req: Request, res: Response) => {
  const parseResult = querySchema.safeParse(req.query);

  if (!parseResult.success) {
    const errorDetails = parseResult.error.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));
    return res.status(400).json({
      error: 'Invalid query parameters',
      details: errorDetails,
    });
  }

  const { city, minPrice, maxPrice, fresh } = parseResult.data;

  try {
    const hotels = await orchestratorService.getHotels(
      { city, minPrice, maxPrice },
      fresh ?? false
    );

    return res.json(hotels);
  } catch (error: any) {
    logger.error({ error: error.message, city }, 'Error orchestrating hotel offers');
    return res.status(500).json({
      error: 'Failed to retrieve hotel offers',
      message: error.message,
    });
  }
});
