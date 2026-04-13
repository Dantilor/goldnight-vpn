import type { FastifyBaseLogger } from 'fastify';
import type { SubscriptionTelegramNotifier } from '../modules/subscription-notify/subscription-telegram-notifier.js';

/** Periodic scan for 5d / 1d expiry reminders (Telegram). */
export function startSubscriptionReminderScheduler(input: {
  notifier: SubscriptionTelegramNotifier;
  intervalMs: number;
  log: FastifyBaseLogger;
}): () => void {
  const tick = () => {
    void input.notifier.runExpiryReminderPass().catch((err: unknown) => {
      input.log.error({ err }, 'subscription expiry reminder tick failed');
    });
  };
  const id = setInterval(tick, input.intervalMs);
  tick();
  return () => clearInterval(id);
}
