class SupplierStateManager {
  private supplierAHealthy = true;
  private supplierBHealthy = true;

  public isSupplierAHealthy(): boolean {
    return this.supplierAHealthy;
  }

  public setSupplierAHealthy(healthy: boolean): void {
    this.supplierAHealthy = healthy;
  }

  public isSupplierBHealthy(): boolean {
    return this.supplierBHealthy;
  }

  public setSupplierBHealthy(healthy: boolean): void {
    this.supplierBHealthy = healthy;
  }

  public reset(): void {
    this.supplierAHealthy = true;
    this.supplierBHealthy = true;
  }
}

export const supplierState = new SupplierStateManager();
