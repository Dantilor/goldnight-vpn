import type { ApiEnv } from '@goldnight/config';
import {
  YOOKASSA_RECEIPT_CURRENCY,
  YOOKASSA_RECEIPT_DESCRIPTION_MAX_LEN,
  YOOKASSA_RECEIPT_ITEM_QUANTITY,
  YOOKASSA_RECEIPT_PAYMENT_MODE,
  YOOKASSA_RECEIPT_PAYMENT_SUBJECT,
  YOOKASSA_RECEIPT_VAT_CODE_DEFAULT
} from './yookassa-receipt-constants.js';

export function subscriptionReceiptItemDescription(planName: string): string {
  const base = `Подписка GoldNight VPN — ${planName}`;
  return base.length <= YOOKASSA_RECEIPT_DESCRIPTION_MAX_LEN
    ? base
    : base.slice(0, YOOKASSA_RECEIPT_DESCRIPTION_MAX_LEN);
}

function receiptVatCode(env: ApiEnv): number {
  return env.YOOKASSA_RECEIPT_VAT_CODE ?? YOOKASSA_RECEIPT_VAT_CODE_DEFAULT;
}

/**
 * Тело `receipt` для создания платежа YooKassa (одна позиция = сумма платежа).
 */
export function buildYooKassaPaymentReceipt(
  env: ApiEnv,
  input: {
    customerEmail: string;
    amountValue: string;
    itemDescription: string;
  }
): {
  customer: { email: string };
  items: Array<{
    description: string;
    quantity: typeof YOOKASSA_RECEIPT_ITEM_QUANTITY;
    amount: { value: string; currency: typeof YOOKASSA_RECEIPT_CURRENCY };
    vat_code: number;
    payment_mode: typeof YOOKASSA_RECEIPT_PAYMENT_MODE;
    payment_subject: typeof YOOKASSA_RECEIPT_PAYMENT_SUBJECT;
  }>;
} {
  return {
    customer: { email: input.customerEmail },
    items: [
      {
        description: input.itemDescription,
        quantity: YOOKASSA_RECEIPT_ITEM_QUANTITY,
        amount: { value: input.amountValue, currency: YOOKASSA_RECEIPT_CURRENCY },
        vat_code: receiptVatCode(env),
        payment_mode: YOOKASSA_RECEIPT_PAYMENT_MODE,
        payment_subject: YOOKASSA_RECEIPT_PAYMENT_SUBJECT
      }
    ]
  };
}
