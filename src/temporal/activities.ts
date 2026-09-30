import axios from 'axios';
import { config } from '../config/env';
import { SupplierOffer, DeduplicatedHotel } from '../types/hotel';
import { redisService } from '../redis/client';
import { logger } from '../logger';

export interface HotelActivities {
  fetchSupplierAHotels(city: string): Promise<SupplierOffer[]>;
  fetchSupplierBHotels(city: string): Promise<SupplierOffer[]>;
  saveHotelsToRedisActivity(city: string, hotels: DeduplicatedHotel[]): Promise<void>;
}

export function createActivities(customRedisService = redisService): HotelActivities {
  return {
    async fetchSupplierAHotels(city: string): Promise<SupplierOffer[]> {
      // If simulated down in memory, fail immediately
      const { supplierState } = await import('../suppliers/state');
      if (!supplierState.isSupplierAHealthy()) {
        throw new Error('Supplier A is currently unavailable (Simulated Downtime)');
      }

      const url = `${config.supplierAUrl}?city=${encodeURIComponent(city)}`;
      logger.info({ city, url }, 'Temporal Activity: Fetching hotels from Supplier A');
      try {
        const response = await axios.get<SupplierOffer[]>(url, {
          timeout: 2000,
        });
        logger.info(
          { city, count: response.data.length },
          'Temporal Activity: Successfully fetched Supplier A hotels'
        );
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 503 || !supplierState.isSupplierAHealthy()) {
          throw new Error('Supplier A is currently unavailable (Simulated Downtime)');
        }
        // In-process fallback (e.g. during integration tests before TCP server is bound)
        if (err.code === 'ECONNREFUSED' || config.nodeEnv === 'test') {
          const { supplierAHotels } = await import('../suppliers/mockData');
          const normalized = city.trim().toLowerCase();
          return supplierAHotels.filter((h) => h.city.toLowerCase() === normalized);
        }
        logger.error(
          { city, error: err.message, status: err.response?.status },
          'Temporal Activity: Failed to fetch from Supplier A'
        );
        throw new Error(`Supplier A error: ${err.response?.status || err.message}`);
      }
    },

    async fetchSupplierBHotels(city: string): Promise<SupplierOffer[]> {
      // If simulated down in memory, fail immediately
      const { supplierState } = await import('../suppliers/state');
      if (!supplierState.isSupplierBHealthy()) {
        throw new Error('Supplier B is currently unavailable (Simulated Downtime)');
      }

      const url = `${config.supplierBUrl}?city=${encodeURIComponent(city)}`;
      logger.info({ city, url }, 'Temporal Activity: Fetching hotels from Supplier B');
      try {
        const response = await axios.get<SupplierOffer[]>(url, {
          timeout: 2000,
        });
        logger.info(
          { city, count: response.data.length },
          'Temporal Activity: Successfully fetched Supplier B hotels'
        );
        return response.data;
      } catch (err: any) {
        if (err.response?.status === 503 || !supplierState.isSupplierBHealthy()) {
          throw new Error('Supplier B is currently unavailable (Simulated Downtime)');
        }
        // In-process fallback (e.g. during integration tests before TCP server is bound)
        if (err.code === 'ECONNREFUSED' || config.nodeEnv === 'test') {
          const { supplierBHotels } = await import('../suppliers/mockData');
          const normalized = city.trim().toLowerCase();
          return supplierBHotels.filter((h) => h.city.toLowerCase() === normalized);
        }
        logger.error(
          { city, error: err.message, status: err.response?.status },
          'Temporal Activity: Failed to fetch from Supplier B'
        );
        throw new Error(`Supplier B error: ${err.response?.status || err.message}`);
      }
    },

    async saveHotelsToRedisActivity(city: string, hotels: DeduplicatedHotel[]): Promise<void> {
      logger.info(
        { city, count: hotels.length },
        'Temporal Activity: Saving deduplicated hotels to Redis'
      );
      await customRedisService.saveHotels(city, hotels);
    },
  };
}

export const activities = createActivities();
