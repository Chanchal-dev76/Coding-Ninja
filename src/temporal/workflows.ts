import { proxyActivities, log, ApplicationFailure } from '@temporalio/workflow';
import type { HotelActivities } from './activities';
import { deduplicateHotels } from '../services/deduplication';
import { DeduplicatedHotel, SupplierOffer } from '../types/hotel';

const { fetchSupplierAHotels, fetchSupplierBHotels, saveHotelsToRedisActivity } =
  proxyActivities<HotelActivities>({
    startToCloseTimeout: '10 seconds',
    retry: {
      initialInterval: '500 milliseconds',
      maximumAttempts: 2,
      backoffCoefficient: 1.5,
    },
  });

/**
 * Temporal Workflow: hotelOrchestratorWorkflow
 * 1. Calls Supplier A and Supplier B in parallel
 * 2. Handles partial supplier degradation gracefully
 * 3. Deduplicates hotels by name, picking the best price
 * 4. Persists the deduplicated result in Redis
 * 5. Returns the final deduplicated list
 */
export async function hotelOrchestratorWorkflow(city: string): Promise<DeduplicatedHotel[]> {
  log.info(`Starting hotel orchestrator workflow for city: ${city}`);

  // Fetch both suppliers in parallel
  const [resultA, resultB] = await Promise.allSettled([
    fetchSupplierAHotels(city),
    fetchSupplierBHotels(city),
  ]);

  let supplierAOffers: SupplierOffer[] = [];
  let supplierBOffers: SupplierOffer[] = [];
  let failedSuppliers = 0;

  if (resultA.status === 'fulfilled') {
    supplierAOffers = resultA.value;
    log.info(`Supplier A returned ${supplierAOffers.length} hotels for ${city}`);
  } else {
    log.warn(`Supplier A failed: ${resultA.reason?.message || resultA.reason}`);
    failedSuppliers++;
  }

  if (resultB.status === 'fulfilled') {
    supplierBOffers = resultB.value;
    log.info(`Supplier B returned ${supplierBOffers.length} hotels for ${city}`);
  } else {
    log.warn(`Supplier B failed: ${resultB.reason?.message || resultB.reason}`);
    failedSuppliers++;
  }

  // If both suppliers fail, abort workflow
  if (failedSuppliers === 2) {
    throw ApplicationFailure.nonRetryable(
      `Both Supplier A and Supplier B failed to respond for city: ${city}`
    );
  }

  // Deduplicate and pick best price
  const deduplicated = deduplicateHotels(supplierAOffers, supplierBOffers);
  log.info(`Deduplicated ${deduplicated.length} hotel offers for ${city}`);

  // Save deduplicated results to Redis
  await saveHotelsToRedisActivity(city, deduplicated);

  return deduplicated;
}
