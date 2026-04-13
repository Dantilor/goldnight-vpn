import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { CheckoutEmailRequiredError } from './checkout-errors.js';
import { YooKassaPaymentService } from './service.js';
import { yookassaCheckoutBodySchema } from './schemas.js';
import { userFacingMessageFromYooKassaPayload, YooKassaApiError } from './yookassa-rest.js';

type YooNotificationBody = {
  type?: string;
  event?: string;
  object?: { id?: string };
};

export async function registerPaymentRoutes(app: FastifyInstance, ctx: AppContext) {
  const service = new YooKassaPaymentService(ctx.env, ctx.dataLayer, ctx.subscriptionTelegramNotifier);

  app.get('/payments/status', async () => ({
    yookassaConfigured: service.isConfigured()
  }));

  app.post(
    '/me/payments/yookassa/checkout',
    { preHandler: [ctx.requireAuth] },
    async (request, reply) => {
      if (!service.isConfigured()) {
        return reply.code(503).send({ message: 'Платежи временно недоступны.' });
      }
      const body = yookassaCheckoutBodySchema.parse(request.body ?? {});
      const userId = request.authUser!.id;
      try {
        const checkoutOpts =
          body.receiptEmail !== undefined ? { receiptEmail: body.receiptEmail } : undefined;
        const { confirmationUrl } = await service.createCheckoutForUser(userId, body.planId, checkoutOpts);
        return { confirmationUrl };
      } catch (err) {
        if (err instanceof CheckoutEmailRequiredError) {
          return reply.code(400).send({
            code: err.code,
            message: err.message
          });
        }
        if (err instanceof YooKassaApiError) {
          request.log.error(
            {
              err: err.message,
              httpStatus: err.httpStatus,
              yooKassaPayload: err.responsePayload
            },
            'YooKassa checkout API error'
          );
          return reply.code(502).send({
            code: 'YOOKASSA_CHECKOUT_FAILED',
            message: userFacingMessageFromYooKassaPayload(err.responsePayload)
          });
        }
        const msg = err instanceof Error ? err.message : 'Checkout failed';
        if (msg === 'PLAN_NOT_FOUND') {
          return reply.code(404).send({ message: 'Тариф не найден или отключён.' });
        }
        if (msg === 'USER_NOT_FOUND') {
          return reply.code(401).send({ message: 'Пользователь не найден. Войдите снова.' });
        }
        request.log.error({ err }, 'YooKassa checkout failed');
        return reply.code(502).send({
          code: 'CHECKOUT_FAILED',
          message: 'Не удалось создать платёж. Попробуйте позже или напишите в поддержку.'
        });
      }
    }
  );

  app.post('/payments/yookassa/webhook', async (request, reply) => {
    if (!service.isConfigured()) {
      return reply.code(503).send({ message: 'Payments not configured' });
    }
    const secret = ctx.env.YOOKASSA_WEBHOOK_SECRET;
    if (secret) {
      const got = request.headers['x-yookassa-webhook-secret'];
      if (got !== secret) {
        return reply.code(401).send({ message: 'Unauthorized' });
      }
    }
    const payload = request.body as YooNotificationBody;
    if (payload.type !== 'notification' || typeof payload.event !== 'string') {
      return reply.code(400).send({ message: 'Invalid notification' });
    }
    if (payload.event !== 'payment.succeeded') {
      return { ok: true, ignored: true };
    }
    const ykId = payload.object?.id;
    if (typeof ykId !== 'string' || !ykId) {
      return reply.code(400).send({ message: 'Invalid object id' });
    }
    try {
      const result = await service.handlePaymentSucceededNotification(ykId, {
        onTelegramNotifyError: (err) => request.log.error({ err, ykId }, 'Telegram notify after payment failed')
      });
      return { ok: true, result };
    } catch (err) {
      if (err instanceof YooKassaApiError) {
        request.log.error(
          { err: err.message, httpStatus: err.httpStatus, yooKassaPayload: err.responsePayload, ykId },
          'YooKassa webhook get payment failed'
        );
      } else {
        request.log.error({ err, ykId }, 'YooKassa webhook processing failed');
      }
      return reply.code(500).send({ message: 'Webhook handler error' });
    }
  });
}
