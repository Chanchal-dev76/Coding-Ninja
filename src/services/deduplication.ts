import { SupplierOffer, DeduplicatedHotel } from '../types/hotel';

/**
 * Deduplicates hotel offers from Supplier A and Supplier B.
 * Rules:
 * 1. For each hotel name that appears in both lists, select the one with the cheaper price.
 *    If prices are equal, select the offer with higher commission (or Supplier A as deterministic tiebreaker).
 * 2. If only one supplier returns a hotel, select that one.
 * 3. Maps to the requested response format: { name, price, supplier, commissionPct }
 */
export function deduplicateHotels(
  supplierAOffers: SupplierOffer[],
  supplierBOffers: SupplierOffer[]
): DeduplicatedHotel[] {
  const hotelMap = new Map<
    string,
    {
      offerA?: SupplierOffer;
      offerB?: SupplierOffer;
    }
  >();

  for (const offer of supplierAOffers) {
    const key = offer.name.trim().toLowerCase();
    const existing = hotelMap.get(key) || {};
    existing.offerA = offer;
    hotelMap.set(key, existing);
  }

  for (const offer of supplierBOffers) {
    const key = offer.name.trim().toLowerCase();
    const existing = hotelMap.get(key) || {};
    existing.offerB = offer;
    hotelMap.set(key, existing);
  }

  const deduplicated: DeduplicatedHotel[] = [];

  for (const [, { offerA, offerB }] of hotelMap.entries()) {
    if (offerA && offerB) {
      if (offerA.price < offerB.price) {
        deduplicated.push({
          name: offerA.name,
          price: offerA.price,
          supplier: 'Supplier A',
          commissionPct: offerA.commissionPct,
        });
      } else if (offerB.price < offerA.price) {
        deduplicated.push({
          name: offerB.name,
          price: offerB.price,
          supplier: 'Supplier B',
          commissionPct: offerB.commissionPct,
        });
      } else {
        // Equal price: pick higher commission or default to Supplier A
        const winningOffer = offerB.commissionPct > offerA.commissionPct ? offerB : offerA;
        const supplierName = winningOffer === offerB ? 'Supplier B' : 'Supplier A';
        deduplicated.push({
          name: winningOffer.name,
          price: winningOffer.price,
          supplier: supplierName,
          commissionPct: winningOffer.commissionPct,
        });
      }
    } else if (offerA) {
      deduplicated.push({
        name: offerA.name,
        price: offerA.price,
        supplier: 'Supplier A',
        commissionPct: offerA.commissionPct,
      });
    } else if (offerB) {
      deduplicated.push({
        name: offerB.name,
        price: offerB.price,
        supplier: 'Supplier B',
        commissionPct: offerB.commissionPct,
      });
    }
  }

  // Sort by price ascending
  deduplicated.sort((a, b) => a.price - b.price);

  return deduplicated;
}
