/** Отсутствует email для формирования фискального чека (54-ФЗ). */
export class CheckoutEmailRequiredError extends Error {
  readonly code = 'EMAIL_REQUIRED_FOR_RECEIPT' as const;

  constructor() {
    super(
      'Укажите email для чека: он нужен для отправки электронного чека после оплаты. Введите email в форме ниже и повторите оплату.'
    );
    this.name = 'CheckoutEmailRequiredError';
  }
}
