import { describe, it, expect } from 'vitest';
import { deduplicateHotels } from '../src/services/deduplication';
import { SupplierOffer } from '../src/types/hotel';

describe('Deduplication Service', () => {
  it('should select Supplier B when Supplier B is cheaper', () => {
    const supplierA: SupplierOffer[] = [
      { hotelId: 'a1', name: 'Holtin', price: 6000, city: 'delhi', commissionPct: 10 },
    ];
    const supplierB: SupplierOffer[] = [
      { hotelId: 'b1', name: 'Holtin', price: 5340, city: 'delhi', commissionPct: 20 },
    ];

    const result = deduplicateHotels(supplierA, supplierB);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Holtin',
      price: 5340,
      supplier: 'Supplier B',
      commissionPct: 20,
    });
  });

  it('should select Supplier A when Supplier A is cheaper', () => {
    const supplierA: SupplierOffer[] = [
      { hotelId: 'a2', name: 'Radison', price: 5900, city: 'delhi', commissionPct: 13 },
    ];
    const supplierB: SupplierOffer[] = [
      { hotelId: 'b2', name: 'Radison', price: 6200, city: 'delhi', commissionPct: 11 },
    ];

    const result = deduplicateHotels(supplierA, supplierB);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Radison',
      price: 5900,
      supplier: 'Supplier A',
      commissionPct: 13,
    });
  });

  it('should include hotel when only Supplier A offers it', () => {
    const supplierA: SupplierOffer[] = [
      { hotelId: 'a4', name: 'Taj Palace', price: 9500, city: 'delhi', commissionPct: 12 },
    ];
    const supplierB: SupplierOffer[] = [];

    const result = deduplicateHotels(supplierA, supplierB);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Taj Palace',
      price: 9500,
      supplier: 'Supplier A',
      commissionPct: 12,
    });
  });

  it('should include hotel when only Supplier B offers it', () => {
    const supplierA: SupplierOffer[] = [];
    const supplierB: SupplierOffer[] = [
      { hotelId: 'b4', name: 'Marriott Aerocity', price: 7200, city: 'delhi', commissionPct: 16 },
    ];

    const result = deduplicateHotels(supplierA, supplierB);

    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      name: 'Marriott Aerocity',
      price: 7200,
      supplier: 'Supplier B',
      commissionPct: 16,
    });
  });

  it('should sort results ascending by price', () => {
    const supplierA: SupplierOffer[] = [
      { hotelId: 'a1', name: 'Expensive Hotel', price: 10000, city: 'delhi', commissionPct: 10 },
      { hotelId: 'a2', name: 'Cheap Hotel', price: 3000, city: 'delhi', commissionPct: 10 },
    ];
    const supplierB: SupplierOffer[] = [
      { hotelId: 'b1', name: 'Mid Hotel', price: 5000, city: 'delhi', commissionPct: 15 },
    ];

    const result = deduplicateHotels(supplierA, supplierB);

    expect(result.map((h) => h.price)).toEqual([3000, 5000, 10000]);
  });

  it('should handle empty lists from both suppliers', () => {
    const result = deduplicateHotels([], []);
    expect(result).toEqual([]);
  });

  it('should resolve equal price tie by choosing higher commission', () => {
    const supplierA: SupplierOffer[] = [
      { hotelId: 'a1', name: 'ITC Maurya', price: 8900, city: 'delhi', commissionPct: 14 },
    ];
    const supplierB: SupplierOffer[] = [
      { hotelId: 'b1', name: 'ITC Maurya', price: 8900, city: 'delhi', commissionPct: 18 },
    ];

    const result = deduplicateHotels(supplierA, supplierB);

    expect(result).toHaveLength(1);
    expect(result[0].supplier).toBe('Supplier B');
    expect(result[0].commissionPct).toBe(18);
  });
});
