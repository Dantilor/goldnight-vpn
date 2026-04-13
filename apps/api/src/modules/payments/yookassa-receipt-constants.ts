/**
 * YooKassa 54-FZ receipt parameters for subscription (digital service).
 * @see https://yookassa.ru/developers/payment-acceptance/receipts/54fz/yoomoney/parameters
 */

/** Item quantity must be a decimal string with exactly three fractional digits. */
export const YOOKASSA_RECEIPT_ITEM_QUANTITY = '1.000' as const;

/**
 * НДС в чеке (код YooKassa). 1 — без НДС (типично для УСН).
 * Переопределяется через YOOKASSA_RECEIPT_VAT_CODE в окружении API при необходимости.
 */
export const YOOKASSA_RECEIPT_VAT_CODE_DEFAULT = 1;

export const YOOKASSA_RECEIPT_PAYMENT_MODE = 'full_payment' as const;

/** Услуга (подписка VPN) — предмет расчёта для 54-ФЗ. */
export const YOOKASSA_RECEIPT_PAYMENT_SUBJECT = 'service' as const;

export const YOOKASSA_RECEIPT_CURRENCY = 'RUB' as const;

/** Максимальная длина наименования позиции в чеке YooKassa. */
export const YOOKASSA_RECEIPT_DESCRIPTION_MAX_LEN = 128;
