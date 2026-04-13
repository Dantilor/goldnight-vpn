import { randomUUID } from 'node:crypto';
import type { ApiEnv } from '@goldnight/config';
import type { DataLayer } from '../../lib/data-layer.js';
import type { SubscriptionTelegramNotifier } from '../subscription-notify/subscription-telegram-notifier.js';
import { CheckoutEmailRequiredError } from './checkout-errors.js';
import {
  buildYooKassaPaymentReceipt,
  subscriptionReceiptItemDescription
} from './yookassa-receipt.js';
import {
  confirmationUrlFromPayment,
  yookassaCreatePayment,
  yookassaGetPayment,
  YooKassaApiError,
  type YooKassaPaymentRemote
} from './yookassa-rest.js';

function formatRub(value: number): string {
  return value.toFixed(2);
}

function normalizeReceiptEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function amountsMatch(remote: YooKassaPaymentRemote, expectedRub: number): boolean {
  const v = remote.amount?.value;
  if (typeof v !== 'string') return false;
  const a = Number.parseFloat(v);
  const b = Number.parseFloat(formatRub(expectedRub));
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) < 0.005;
}

export class YooKassaPaymentService {
  constructor(
    private readonly env: ApiEnv,
    private readonly dataLayer: DataLayer,
    private readonly subscriptionTelegramNotifier: SubscriptionTelegramNotifier | null,
    private readonly revokeAllVpnForUser?: (userId: string) => Promise<void>
  ) {}

  isConfigured(): boolean {
    return Boolean(this.env.YOOKASSA_SHOP_ID && this.env.YOOKASSA_SECRET_KEY);
  }

  /**
   * Создаёт pending-платёж и платёж в YooKassa с фискальным чеком (receipt).
   * Email для чека — только из профиля или из `receiptEmail` в этом запросе (сохраняется в профиль).
   */
  async createCheckoutForUser(
    userId: string,
    planId: string,
    opts?: { receiptEmail?: string }
  ): Promise<{ confirmationUrl: string }> {
    if (!this.isConfigured()) {
      throw new Error('YooKassa is not configured on this server');
    }
    const user = await this.dataLayer.getUserById(userId);
    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    let receiptEmail = user.email?.trim() ? normalizeReceiptEmail(user.email) : null;
    if (opts?.receiptEmail !== undefined && opts.receiptEmail !== '') {
      const normalized = normalizeReceiptEmail(opts.receiptEmail);
      await this.dataLayer.updateUserEmail(userId, normalized);
      receiptEmail = normalized;
    }

    if (!receiptEmail) {
      throw new CheckoutEmailRequiredError();
    }

    const plan = await this.dataLayer.getPlanById(planId);
    if (!plan || !plan.active) {
      throw new Error('PLAN_NOT_FOUND');
    }

    const amountValue = formatRub(plan.priceRub);
    const itemDescription = subscriptionReceiptItemDescription(plan.name);
    const receipt = buildYooKassaPaymentReceipt(this.env, {
      customerEmail: receiptEmail,
      amountValue,
      itemDescription
    });

    const { id: localPaymentId } = await this.dataLayer.createPendingPayment({
      userId,
      planId,
      amountRub: plan.priceRub,
      currency: 'RUB',
      provider: 'yookassa',
      metadata: { planCode: plan.code }
    });
    const returnUrl = this.env.YOOKASSA_RETURN_URL ?? this.env.TELEGRAM_WEBAPP_URL;
    const idempotenceKey = randomUUID();
    let remote: YooKassaPaymentRemote;
    try {
      remote = await yookassaCreatePayment({
        env: this.env,
        idempotenceKey,
        amountValue,
        currency: 'RUB',
        returnUrl,
        description: `GoldNight VPN · ${plan.name}`,
        metadata: {
          gn_payment_id: localPaymentId,
          gn_user_id: userId,
          gn_plan_id: planId
        },
        receipt
      });
    } catch (e) {
      if (e instanceof YooKassaApiError) {
        throw e;
      }
      throw new Error(e instanceof Error ? e.message : 'YooKassa request failed');
    }
    if (!remote.id) {
      throw new Error('YooKassa response missing payment id');
    }
    await this.dataLayer.setPaymentProviderPaymentId(localPaymentId, remote.id);
    const confirmationUrl = confirmationUrlFromPayment(remote);
    if (!confirmationUrl) {
      throw new Error('YooKassa response missing confirmation URL');
    }
    return { confirmationUrl };
  }

  /**
   * Confirms a succeeded YooKassa payment and activates subscription (idempotent).
   */
  async handlePaymentSucceededNotification(
    yookassaPaymentId: string,
    opts?: { onTelegramNotifyError?: (err: unknown) => void; onVpnRevokeError?: (err: unknown) => void }
  ): Promise<'processed' | 'ignored'> {
    const remote = await yookassaGetPayment(this.env, yookassaPaymentId);
    if (remote.status !== 'succeeded' || !remote.paid) {
      return 'ignored';
    }
    const local = await this.dataLayer.getPaymentByProviderId(yookassaPaymentId);
    if (!local || local.status !== 'pending') {
      return 'ignored';
    }
    if (!amountsMatch(remote, local.amountRub)) {
      throw new Error('YooKassa amount mismatch for local payment');
    }
    const meta = remote.metadata ?? {};
    if (meta.gn_user_id && meta.gn_user_id !== local.userId) {
      throw new Error('YooKassa metadata user mismatch');
    }
    if (meta.gn_plan_id && meta.gn_plan_id !== local.planId) {
      throw new Error('YooKassa metadata plan mismatch');
    }
    if (meta.gn_payment_id && meta.gn_payment_id !== local.id) {
      throw new Error('YooKassa metadata payment mismatch');
    }
    const claimed = await this.dataLayer.claimPaymentAsPaidIfPending(yookassaPaymentId);
    if (!claimed) {
      return 'ignored';
    }
    try {
      await this.revokeAllVpnForUser?.(claimed.userId);
    } catch (err) {
      opts?.onVpnRevokeError?.(err);
    }
    await this.dataLayer.replaceActiveSubscriptionWithNewPlan(claimed.userId, claimed.planId);
    try {
      await this.subscriptionTelegramNotifier?.notifyPaymentSuccess(claimed.userId);
    } catch (err) {
      opts?.onTelegramNotifyError?.(err);
    }
    return 'processed';
  }
}
