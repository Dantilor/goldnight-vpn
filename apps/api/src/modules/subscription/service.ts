import type { DataLayer } from '../../lib/data-layer.js';

export class SubscriptionService {
  constructor(private readonly dataLayer: DataLayer) {}

  async getCurrent(userId: string) {
    return this.dataLayer.getActiveSubscriptionByUserId(userId);
  }
}
