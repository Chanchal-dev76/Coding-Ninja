export interface SupplierOffer {
  hotelId: string;
  name: string;
  price: number;
  city: string;
  commissionPct: number;
}

export interface DeduplicatedHotel {
  name: string;
  price: number;
  supplier: string;
  commissionPct: number;
}

export interface PriceFilterQuery {
  city: string;
  minPrice?: number;
  maxPrice?: number;
}

export interface HealthCheckServiceStatus {
  status: 'UP' | 'DOWN';
  message?: string;
  latencyMs?: number;
}

export interface HealthCheckResponse {
  status: 'UP' | 'DEGRADED' | 'DOWN';
  timestamp: string;
  services: {
    supplierA: HealthCheckServiceStatus;
    supplierB: HealthCheckServiceStatus;
    redis: HealthCheckServiceStatus;
    temporal: HealthCheckServiceStatus;
  };
}
