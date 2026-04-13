import type { ApiEnv } from '@goldnight/config';

type YooMoneyAmount = { value: string; currency: string };

export type YooKassaPaymentRemote = {
  id: string;
  status: string;
  paid?: boolean;
  amount?: YooMoneyAmount;
  metadata?: Record<string, string>;
};

export type YooKassaReceiptPayload = {
  customer: { email: string };
  items: Array<{
    description: string;
    quantity: string;
    amount: { value: string; currency: string };
    vat_code: number;
    payment_mode: string;
    payment_subject: string;
  }>;
};

export class YooKassaApiError extends Error {
  readonly name = 'YooKassaApiError';

  constructor(
    message: string,
    readonly httpStatus: number,
    readonly responsePayload: unknown
  ) {
    super(message);
  }
}

function basicAuthHeader(env: ApiEnv): string {
  const id = env.YOOKASSA_SHOP_ID!;
  const key = env.YOOKASSA_SECRET_KEY!;
  const token = Buffer.from(`${id}:${key}`, 'utf8').toString('base64');
  return `Basic ${token}`;
}

function extractYooKassaErrorDescription(payload: unknown): string | null {
  if (!payload || typeof payload !== 'object') return null;
  const o = payload as Record<string, unknown>;
  if (typeof o.description === 'string' && o.description.trim()) return o.description.trim();
  return null;
}

/** Сообщение для клиента API (рус.), по ответу YooKassa. */
export function userFacingMessageFromYooKassaPayload(payload: unknown): string {
  const desc = extractYooKassaErrorDescription(payload) ?? '';
  const lower = desc.toLowerCase();
  if (lower.includes('receipt') || lower.includes('чек')) {
    return 'Не удалось сформировать чек для оплаты. Проверьте email и попробуйте снова. Если ошибка повторяется, напишите в поддержку.';
  }
  if (lower.includes('email') || lower.includes('почт')) {
    return 'Проверьте корректность email для чека и попробуйте снова.';
  }
  if (desc) {
    return `Платёжная система отклонила запрос: ${desc}`;
  }
  return 'Не удалось создать платёж. Попробуйте позже или напишите в поддержку.';
}

export async function yookassaCreatePayment(input: {
  env: ApiEnv;
  idempotenceKey: string;
  amountValue: string;
  currency: string;
  returnUrl: string;
  description: string;
  metadata: Record<string, string>;
  receipt: YooKassaReceiptPayload;
}): Promise<YooKassaPaymentRemote> {
  const res = await fetch('https://api.yookassa.ru/v3/payments', {
    method: 'POST',
    headers: {
      Authorization: basicAuthHeader(input.env),
      'Content-Type': 'application/json',
      'Idempotence-Key': input.idempotenceKey
    },
    body: JSON.stringify({
      amount: { value: input.amountValue, currency: input.currency },
      capture: true,
      confirmation: { type: 'redirect', return_url: input.returnUrl },
      description: input.description,
      metadata: input.metadata,
      receipt: input.receipt
    })
  });
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const desc = extractYooKassaErrorDescription(payload);
    const msg = desc ?? `YooKassa create failed (${res.status})`;
    throw new YooKassaApiError(msg, res.status, payload);
  }
  return payload as YooKassaPaymentRemote;
}

export async function yookassaGetPayment(
  env: ApiEnv,
  paymentId: string
): Promise<YooKassaPaymentRemote> {
  const res = await fetch(`https://api.yookassa.ru/v3/payments/${encodeURIComponent(paymentId)}`, {
    headers: { Authorization: basicAuthHeader(env) }
  });
  let payload: unknown;
  try {
    payload = await res.json();
  } catch {
    payload = null;
  }
  if (!res.ok) {
    const desc = extractYooKassaErrorDescription(payload);
    const msg = desc ?? `YooKassa get payment failed (${res.status})`;
    throw new YooKassaApiError(msg, res.status, payload);
  }
  return payload as YooKassaPaymentRemote;
}

export function confirmationUrlFromPayment(payment: YooKassaPaymentRemote): string | null {
  const c = (payment as { confirmation?: { confirmation_url?: string } }).confirmation;
  return typeof c?.confirmation_url === 'string' ? c.confirmation_url : null;
}
