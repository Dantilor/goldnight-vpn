import type { DataLayer } from '../../lib/data-layer.js';

export class PlansService {
  constructor(private readonly dataLayer: DataLayer) {}

  async list(input: { onlyActive: boolean }) {
    return this.dataLayer.listPlans(input);
  }
}
