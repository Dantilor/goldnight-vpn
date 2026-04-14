import type { ApiEnv } from '@goldnight/config';
import type { DataLayer, SubscriptionNotificationTypeName } from '../../lib/data-layer.js';

const DAY_MS = 86_400_000;

function escapeHtml(s: string): string {
  return s
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');
}

function formatSubscriptionPeriod(days: number): string {
  if (days % 365 === 0) {
    const years = days / 365;
    return `${years} ${years === 1 ? 'год' : years < 5 ? 'года' : 'лет'}`;
  }
  if (days % 30 === 0) {
    const months = days / 30;
    return `${months} ${months === 1 ? 'месяц' : months < 5 ? 'месяца' : 'месяцев'}`;
  }
  return `${days} дн.`;
}

/** Build Mini App HTTPS URL with hash route (Telegram `web_app` buttons). */
export function miniAppWebUrl(env: ApiEnv, route: string): string {
  const base = env.TELEGRAM_WEBAPP_URL.replace(/\/+$/, '');
  const r = route.replace(/^\//, '');
  return `${base}/#/${r}`;
}

function calendarDaysFromTodayTo(endsAt: Date): number {
  const end = new Date(endsAt);
  const e = Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate());
  const t = new Date();
  const s = Date.UTC(t.getUTCFullYear(), t.getUTCMonth(), t.getUTCDate());
  return Math.round((e - s) / DAY_MS);
}

export class SubscriptionTelegramNotifier {
  constructor(
    private readonly env: ApiEnv,
    private readonly dataLayer: DataLayer
  ) {}

  private botConfigured(): boolean {
    return Boolean(this.env.TELEGRAM_BOT_TOKEN);
  }

  private async tgSend(chatId: string, text: string, replyMarkup?: { inline_keyboard: unknown[][] }): Promise<void> {
    const token = this.env.TELEGRAM_BOT_TOKEN;
    if (!token) return;
    const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
        ...(replyMarkup ? { reply_markup: replyMarkup } : {})
      })
    });
    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Telegram sendMessage failed: ${res.status} ${body}`);
    }
  }

  /**
   * After YooKassa webhook activated subscription (DB row exists). Idempotent via notification row.
   */
  /** After subscription ended and VPN was revoked (scheduler). Idempotent per subscription. */
  async notifySubscriptionExpiredVpnStopped(userId: string, subscriptionId: string): Promise<void> {
    if (!this.botConfigured()) return;
    const reserved = await this.dataLayer.tryCreateSubscriptionNotificationRecord({
      userId,
      subscriptionId,
      type: 'subscription_expired_vpn_stopped'
    });
    if (!reserved) return;
    const user = await this.dataLayer.getUserById(userId);
    if (!user) return;
    const text =
      '<b>Подписка закончилась</b>\n\nДоступ к VPN остановлен. Продлите подписку в приложении и заново выдайте ключ (раздел «Подключение»).';
    const markup = {
      inline_keyboard: [[{ text: 'Продлить доступ', web_app: { url: miniAppWebUrl(this.env, 'plans') } }]]
    };
    try {
      await this.tgSend(user.telegramUserId, text, markup);
    } catch {
      await this.dataLayer
        .deleteSubscriptionNotificationRecord(subscriptionId, 'subscription_expired_vpn_stopped')
        .catch(() => undefined);
    }
  }

  async notifyPaymentSuccess(userId: string): Promise<void> {
    if (!this.botConfigured()) return;
    const sub = await this.dataLayer.getActiveSubscriptionByUserId(userId);
    if (!sub || sub.status !== 'active') return;
    const reserved = await this.dataLayer.tryCreateSubscriptionNotificationRecord({
      userId,
      subscriptionId: sub.id,
      type: 'payment_success'
    });
    if (!reserved) return;
    const user = await this.dataLayer.getUserById(userId);
    if (!user) return;
    const ends = sub.endsAt.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const access = await this.dataLayer.getLatestActiveVpnAccessByUserId(userId);
    const key =
      access?.value?.trim() ||
      access?.qrValue?.trim() ||
      access?.configFileUrl?.trim() ||
      'Будет доступен в Mini App сразу после выдачи.';
    const period = formatSubscriptionPeriod(sub.plan.durationDays);
    const text =
      `✅ <b>Оплата успешно проведена!</b>\n\n` +
      `📦 Тариф: ${escapeHtml(sub.plan.name)}\n` +
      `📆 Период: ${escapeHtml(period)}\n` +
      `📆 Действует до: ${escapeHtml(ends)}\n\n` +
      `🔑 Ваш ключ подключения:\n` +
      `${escapeHtml(key)}\n\n` +
      `Используйте кнопку «Открыть VPN» для подключения.`;
    const markup = {
      inline_keyboard: [[{ text: 'Открыть VPN', web_app: { url: miniAppWebUrl(this.env, 'connect') } }]]
    };
    try {
      await this.tgSend(user.telegramUserId, text, markup);
    } catch {
      await this.dataLayer.deleteSubscriptionNotificationRecord(sub.id, 'payment_success').catch(() => undefined);
    }
  }

  /** Scan active subscriptions and send 5d / 1d reminders once per subscription per type. */
  async runExpiryReminderPass(): Promise<void> {
    if (!this.botConfigured()) return;
    const rows = await this.dataLayer.listActiveSubscriptionsWithTelegramForReminders();
    for (const row of rows) {
      if (!row.telegramUserId) continue;
      const days = calendarDaysFromTodayTo(row.endsAt);
      if (days === 5) {
        await this.trySendReminder(row, 'expires_in_5_days', {
          title: 'Подписка скоро закончится',
          body: 'До окончания подписки осталось 5 дней.\nПродлите доступ заранее, чтобы не потерять подключение.',
          buttonText: 'Продлить доступ'
        });
      } else if (days === 1) {
        await this.trySendReminder(row, 'expires_in_1_day', {
          title: 'Подписка заканчивается завтра',
          body: 'До окончания подписки остался 1 день.\nЧтобы доступ не прерывался, продлите подписку заранее.',
          buttonText: 'Продлить доступ'
        });
      }
    }
  }

  private async trySendReminder(
    row: {
      subscriptionId: string;
      userId: string;
      telegramUserId: string;
      planName: string;
      endsAt: Date;
    },
    type: SubscriptionNotificationTypeName,
    copy: { title: string; body: string; buttonText: string }
  ): Promise<void> {
    const reserved = await this.dataLayer.tryCreateSubscriptionNotificationRecord({
      userId: row.userId,
      subscriptionId: row.subscriptionId,
      type
    });
    if (!reserved) return;
    const ends = row.endsAt.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const text = `<b>${escapeHtml(copy.title)}</b>\n\n${escapeHtml(copy.body)}\n\nТариф: ${escapeHtml(row.planName)}\nДействует до ${escapeHtml(ends)}.`;
    const markup = {
      inline_keyboard: [[{ text: copy.buttonText, web_app: { url: miniAppWebUrl(this.env, 'plans') } }]]
    };
    try {
      await this.tgSend(row.telegramUserId, text, markup);
    } catch {
      await this.dataLayer.deleteSubscriptionNotificationRecord(row.subscriptionId, type).catch(() => undefined);
    }
  }
}

