import type { ApiEnv } from '@goldnight/config';
import type { PrismaClient } from '@prisma/client';
import type { VpnService } from './modules/vpn/vpn-service.js';
import type { preHandlerHookHandler } from 'fastify';
import type { DataLayer } from './lib/data-layer.js';
import type { SubscriptionTelegramNotifier } from './modules/subscription-notify/subscription-telegram-notifier.js';

export interface AppContext {
  env: ApiEnv;
  db: PrismaClient;
  dataLayer: DataLayer;
  vpnService: VpnService;
  requireAuth: preHandlerHookHandler;
  subscriptionTelegramNotifier: SubscriptionTelegramNotifier;
}
