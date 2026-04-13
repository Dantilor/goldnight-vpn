import 'dotenv/config';
import Fastify, { type FastifyInstance, type FastifyRequest } from 'fastify';
import cors from '@fastify/cors';
import { parseApiEnv } from '@goldnight/config';
import { ZodError } from 'zod';
import { prisma } from './lib/prisma.js';
import { createDataLayer } from './lib/data-layer.js';
import { createRequireAuth } from './modules/auth/middleware.js';
import { createVpnProvider } from './modules/vpn/provider-factory.js';
import { VpnService } from './modules/vpn/vpn-service.js';
import { startSubscriptionExpiryScheduler } from './jobs/subscription-expiry-scheduler.js';
import { startSubscriptionReminderScheduler } from './jobs/subscription-reminder-scheduler.js';
import { SubscriptionTelegramNotifier } from './modules/subscription-notify/subscription-telegram-notifier.js';
import { registerModules } from './modules/index.js';

type JsonParserDone = (err: Error | null, body?: unknown) => void;

function registerTolerantJsonBodyParser(app: FastifyInstance) {
  app.removeContentTypeParser('application/json');
  app.addContentTypeParser(
    'application/json',
    { parseAs: 'string' },
    (_req: FastifyRequest, body: string, done: JsonParserDone) => {
      const raw = typeof body === 'string' ? body.trim() : '';
      if (raw === '') {
        done(null, {});
        return;
      }
      try {
        done(null, JSON.parse(body));
      } catch (parseErr) {
        done(parseErr as Error, undefined);
      }
    }
  );
}

async function bootstrap() {
  const env = parseApiEnv(process.env);
  const app = Fastify({ logger: true });

  registerTolerantJsonBodyParser(app);

  await app.register(cors, { origin: true });

  app.setErrorHandler((error, _request, reply) => {
    if (error instanceof ZodError) {
      return reply.code(400).send({
        message: 'Validation failed',
        issues: error.issues
      });
    }
    const code = (error as { code?: string }).code;
    if (code === 'FST_ERR_CTP_EMPTY_JSON_BODY') {
      return reply.code(400).send({
        message: 'Empty JSON body with Content-Type application/json is not valid; send {} or omit the content-type.'
      });
    }
    app.log.error(error);
    return reply.code(500).send({ message: 'Internal Server Error' });
  });

  const dataLayer = createDataLayer({ env, prisma });
  const vpnProvider = createVpnProvider(env, prisma, dataLayer);
  const vpnService = new VpnService(env, vpnProvider, dataLayer);
  const requireAuth = createRequireAuth({ env, dataLayer });
  const subscriptionTelegramNotifier = new SubscriptionTelegramNotifier(env, dataLayer);

  await registerModules(app, {
    env,
    db: prisma,
    dataLayer,
    vpnService,
    requireAuth,
    subscriptionTelegramNotifier
  });

  const reminderEveryMs = env.SUBSCRIPTION_REMINDER_INTERVAL_MS ?? 6 * 3_600_000;
  startSubscriptionReminderScheduler({
    notifier: subscriptionTelegramNotifier,
    intervalMs: reminderEveryMs,
    log: app.log
  });

  const expirySweepEveryMs = env.SUBSCRIPTION_EXPIRY_SWEEP_INTERVAL_MS ?? 10 * 60_000;
  startSubscriptionExpiryScheduler({
    dataLayer,
    vpnService,
    notifier: subscriptionTelegramNotifier,
    intervalMs: expirySweepEveryMs,
    log: app.log
  });

  await app.listen({
    host: '0.0.0.0',
    port: env.PORT
  });
}

bootstrap().catch((error) => {
  console.error(error);
  process.exit(1);
});
