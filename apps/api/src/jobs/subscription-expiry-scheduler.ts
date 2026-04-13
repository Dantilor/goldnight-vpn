import type { FastifyBaseLogger } from 'fastify';
import type { DataLayer } from '../lib/data-layer.js';
import type { SubscriptionTelegramNotifier } from '../modules/subscription-notify/subscription-telegram-notifier.js';
import type { VpnService } from '../modules/vpn/vpn-service.js';

/**
 * Marks overdue subscriptions expired, revokes VPN at provider + DB for affected users,
 * and sends one Telegram notice per expired subscription (deduped).
 */
export function startSubscriptionExpiryScheduler(input: {
  dataLayer: DataLayer;
  vpnService: VpnService;
  notifier: SubscriptionTelegramNotifier;
  intervalMs: number;
  log: FastifyBaseLogger;
}): () => void {
  const tick = () => {
    void (async () => {
      try {
        const transitioned = await input.dataLayer.expireOverdueActiveSubscriptions();
        await input.vpnService.revokeActiveVpnForUsersWithoutValidSubscription();
        for (const row of transitioned) {
          try {
            await input.notifier.notifySubscriptionExpiredVpnStopped(row.userId, row.subscriptionId);
          } catch (err: unknown) {
            input.log.error({ err, userId: row.userId, subscriptionId: row.subscriptionId }, 'expiry telegram notify failed');
          }
        }
      } catch (err: unknown) {
        input.log.error({ err }, 'subscription expiry sweep failed');
      }
    })();
  };
  const id = setInterval(tick, input.intervalMs);
  tick();
  return () => clearInterval(id);
}
