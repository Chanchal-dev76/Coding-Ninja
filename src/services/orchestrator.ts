import { temporalClientManager } from '../temporal/client';
import { activities } from '../temporal/activities';
import { deduplicateHotels } from './deduplication';
import { redisService } from '../redis/client';
import { DeduplicatedHotel, PriceFilterQuery, SupplierOffer } from '../types/hotel';
import { logger } from '../logger';

export class OrchestratorService {
  /**
   * Orchestrates hotel offer fetching, deduplication, Redis storage, and price filtering.
   */
  public async getHotels(
    query: PriceFilterQuery,
    forceRefresh = false
  ): Promise<DeduplicatedHotel[]> {
    const { city, minPrice, maxPrice } = query;
    const normalizedCity = city.trim().toLowerCase();

    // Check if results are already cached in Redis and forceRefresh is false
    const isCached = await redisService.isCityCached(normalizedCity);

    if (!isCached || forceRefresh) {
      logger.info(
        { city: normalizedCity, isCached, forceRefresh },
        'Executing hotel orchestration workflow'
      );
      try {
        // Primary path: Orchestrate via Temporal Workflow
        await temporalClientManager.executeHotelWorkflow(normalizedCity);
      } catch (temporalErr: any) {
        logger.warn(
          { err: temporalErr.message },
          'Temporal cluster unreachable or workflow failed; executing direct resilient pipeline'
        );
        // Resilient fallback: Direct parallel execution of activities
        await this.executeDirectPipeline(normalizedCity);
      }
    } else {
      logger.info({ city: normalizedCity }, 'Serving from Redis cache');
    }

    // Requirement: "Deduplicated list must also be saved in Redis. Implement price filtering inside Redis"
    try {
      const results = await redisService.filterHotelsByPrice(
        normalizedCity,
        minPrice,
        maxPrice
      );
      return results;
    } catch (redisErr: any) {
      logger.error({ err: redisErr.message }, 'Failed to query Redis, falling back to direct fetch');
      const fallbackList = await this.executeDirectPipeline(normalizedCity);
      return fallbackList.filter((h) => {
        if (minPrice !== undefined && h.price < minPrice) return false;
        if (maxPrice !== undefined && h.price > maxPrice) return false;
        return true;
      });
    }
  }

  /**
   * Direct pipeline executing the exact same parallel supplier fetch, deduplication, and Redis persistence.
   */
  public async executeDirectPipeline(city: string): Promise<DeduplicatedHotel[]> {
    logger.info({ city }, 'Executing direct pipeline for parallel supplier fetch');

    const [resultA, resultB] = await Promise.allSettled([
      activities.fetchSupplierAHotels(city),
      activities.fetchSupplierBHotels(city),
    ]);

    let supplierAOffers: SupplierOffer[] = [];
    let supplierBOffers: SupplierOffer[] = [];
    let failures = 0;

    if (resultA.status === 'fulfilled') {
      supplierAOffers = resultA.value;
    } else {
      logger.warn({ error: resultA.reason?.message }, 'Supplier A fetch failed in direct pipeline');
      failures++;
    }

    if (resultB.status === 'fulfilled') {
      supplierBOffers = resultB.value;
    } else {
      logger.warn({ error: resultB.reason?.message }, 'Supplier B fetch failed in direct pipeline');
      failures++;
    }

    if (failures === 2) {
      throw new Error(`Both Supplier A and Supplier B failed to respond for city: ${city}`);
    }

    const deduplicated = deduplicateHotels(supplierAOffers, supplierBOffers);

    try {
      await redisService.saveHotels(city, deduplicated);
    } catch (saveErr: any) {
      logger.warn({ err: saveErr.message }, 'Could not persist deduplicated hotels to Redis');
    }

    return deduplicated;
  }
}

export const orchestratorService = new OrchestratorService();
