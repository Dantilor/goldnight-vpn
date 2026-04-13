import type { ApiEnv } from '@goldnight/config';
import type { PrismaClient } from '@prisma/client';
import { $Enums, Prisma } from '@prisma/client';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export type AppUserRecord = {
  id: string;
  telegramUserId: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  referralCode: string;
  createdAt: Date;
};

export type PlanRecord = {
  id: string;
  code: string;
  name: string;
  priceUsd: number;
  priceRub: number;
  deviceLimit: number;
  subtitle: string | null;
  durationDays: number;
  active: boolean;
  sortOrder: number;
};

export type SubscriptionRecord = {
  id: string;
  userId: string;
  status: string;
  endsAt: Date;
  plan: {
    id: string;
    name: string;
    durationDays: number;
    deviceLimit: number;
  };
};

export type PendingPaymentRecord = {
  id: string;
  userId: string;
  planId: string;
};

export type PaymentLookupRecord = {
  id: string;
  userId: string;
  planId: string;
  amountRub: number;
  status: string;
};

export type VpnAccessRecord = {
  status: string;
  provider: string;
  accessType: string;
  value?: string | null;
  qrValue?: string | null;
  configFileUrl?: string | null;
  deepLinkTemplate?: string | null;
  externalAccessId?: string | null;
  planId?: string | null;
  expiresAt: Date | null;
  deviceFingerprint?: string;
};

/** One logical VPN access row (matches `vpn_access` / `app_vpn_access_records`). */
export type VpnAccessPersistentRow = {
  userId: string;
  provider: string;
  deviceFingerprint: string;
  status: string;
  accessType: string;
  value: string | null;
  qrValue: string | null;
  configFileUrl: string | null;
  deepLinkTemplate: string | null;
  externalAccessId: string | null;
  planId: string | null;
  expiresAt: Date | null;
};

export type UpsertVpnAccessInput = {
  userId: string;
  planId: string | null;
  provider: string;
  deviceFingerprint: string;
  accessType: string;
  status: 'active' | 'expired' | 'revoked';
  externalAccessId: string | null;
  value: string | null;
  qrValue: string | null;
  configFileUrl: string | null;
  deepLinkTemplate: string | null;
  expiresAt: Date | null;
  metadata: unknown;
};

export type VpnDeviceSlotRow = {
  deviceFingerprint: string;
  platform: string | null;
  label: string | null;
  accessStatus: string;
  expiresAt: Date | null;
};

export type UpdateAllVpnAccessForUserInput = {
  planId: string | null;
  accessType: string;
  value: string | null;
  qrValue: string | null;
  configFileUrl: string | null;
  deepLinkTemplate: string | null;
  expiresAt: Date | null;
  status: string;
  metadata: unknown;
};

export type ReferralRecord = {
  id: string;
  invitedUserId: string;
  rewardGranted: boolean;
  createdAt: Date;
};

export type SupportRecord = {
  id: string;
  subject: string;
  status: string;
  createdAt: Date;
};

export type SubscriptionNotificationTypeName = 'payment_success' | 'expires_in_5_days' | 'expires_in_1_day';

export type ActiveSubscriptionReminderRow = {
  subscriptionId: string;
  userId: string;
  telegramUserId: string;
  planName: string;
  endsAt: Date;
};

export interface DataLayer {
  getUserById(userId: string): Promise<AppUserRecord | null>;
  getUserByTelegramId(telegramUserId: string): Promise<AppUserRecord | null>;
  upsertUserByTelegramId(input: {
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    referralCode: string;
  }): Promise<AppUserRecord>;
  updateUserEmail(userId: string, email: string): Promise<void>;
  getActiveSubscriptionByUserId(userId: string): Promise<SubscriptionRecord | null>;
  listPlans(input: { onlyActive: boolean }): Promise<PlanRecord[]>;
  getPlanById(planId: string): Promise<PlanRecord | null>;
  createPendingPayment(input: {
    userId: string;
    planId: string;
    amountRub: number;
    currency: string;
    provider: string;
    metadata?: unknown;
  }): Promise<{ id: string }>;
  getPaymentByProviderId(providerPaymentId: string): Promise<PaymentLookupRecord | null>;
  setPaymentProviderPaymentId(localPaymentId: string, providerPaymentId: string): Promise<void>;
  claimPaymentAsPaidIfPending(providerPaymentId: string): Promise<PendingPaymentRecord | null>;
  replaceActiveSubscriptionWithNewPlan(userId: string, planId: string): Promise<void>;
  listReferralsByInviter(input: { userId: string }): Promise<ReferralRecord[]>;
  countReferrals(input: { userId: string; grantedOnly?: boolean }): Promise<number>;
  listSupportRequests(input: { userId: string }): Promise<SupportRecord[]>;
  countOpenSupport(input: { userId: string }): Promise<number>;
  getLatestActiveVpnAccessByUserId(userId: string): Promise<VpnAccessRecord | null>;
  countActiveVpnAccessByUserAndProvider(userId: string, provider: string): Promise<number>;
  getVpnAccessByUserProviderDevice(
    userId: string,
    provider: string,
    deviceFingerprint: string
  ): Promise<VpnAccessPersistentRow | null>;
  listVpnDeviceSlots(userId: string, provider: string): Promise<VpnDeviceSlotRow[]>;
  listVpnAccessPersistentByUserAndProvider(userId: string, provider: string): Promise<VpnAccessPersistentRow[]>;
  upsertVpnAccessRecord(input: UpsertVpnAccessInput): Promise<void>;
  upsertUserVpnDevice(input: {
    userId: string;
    deviceFingerprint: string;
    platform: string;
    label: string | null;
  }): Promise<void>;
  updateAllVpnAccessForUser(userId: string, input: UpdateAllVpnAccessForUserInput): Promise<void>;
  revokeAllVpnAccessForUser(userId: string): Promise<void>;
  revokeVpnAccessByUserProviderDevice(userId: string, provider: string, deviceFingerprint: string): Promise<void>;
  tryCreateSubscriptionNotificationRecord(input: {
    userId: string;
    subscriptionId: string;
    type: SubscriptionNotificationTypeName;
  }): Promise<boolean>;
  listActiveSubscriptionsWithTelegramForReminders(): Promise<ActiveSubscriptionReminderRow[]>;
  deleteSubscriptionNotificationRecord(
    subscriptionId: string,
    type: SubscriptionNotificationTypeName
  ): Promise<void>;
  checkReadiness(): Promise<{ ok: boolean; detail: string }>;
}

class PrismaDataLayer implements DataLayer {
  constructor(private readonly db: PrismaClient) {}

  async getUserById(userId: string): Promise<AppUserRecord | null> {
    const row = await this.db.user.findUnique({ where: { id: userId } });
    if (!row) return null;
    return {
      id: row.id,
      telegramUserId: row.telegramUserId,
      username: row.username ?? null,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      email: row.email ?? null,
      referralCode: row.referralCode,
      createdAt: row.createdAt
    };
  }

  async getUserByTelegramId(telegramUserId: string): Promise<AppUserRecord | null> {
    const row = await this.db.user.findUnique({ where: { telegramUserId } });
    if (!row) return null;
    return {
      id: row.id,
      telegramUserId: row.telegramUserId,
      username: row.username ?? null,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      email: row.email ?? null,
      referralCode: row.referralCode,
      createdAt: row.createdAt
    };
  }

  async upsertUserByTelegramId(input: {
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    referralCode: string;
  }): Promise<AppUserRecord> {
    const row = await this.db.user.upsert({
      where: { telegramUserId: input.telegramUserId },
      update: {
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName
      },
      create: {
        telegramUserId: input.telegramUserId,
        username: input.username,
        firstName: input.firstName,
        lastName: input.lastName,
        referralCode: input.referralCode
      }
    });
    return {
      id: row.id,
      telegramUserId: row.telegramUserId,
      username: row.username ?? null,
      firstName: row.firstName ?? null,
      lastName: row.lastName ?? null,
      email: row.email ?? null,
      referralCode: row.referralCode,
      createdAt: row.createdAt
    };
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    await this.db.user.update({
      where: { id: userId },
      data: { email }
    });
  }

  async getActiveSubscriptionByUserId(userId: string): Promise<SubscriptionRecord | null> {
    const row = await this.db.subscription.findFirst({
      where: { userId, status: 'active' },
      include: { plan: true },
      orderBy: { endsAt: 'desc' }
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      status: row.status,
      endsAt: row.endsAt,
      plan: {
        id: row.plan.id,
        name: row.plan.name,
        durationDays: row.plan.durationDays,
        deviceLimit: row.plan.deviceLimit
      }
    };
  }

  async listPlans(input: { onlyActive: boolean }): Promise<PlanRecord[]> {
    const where = input.onlyActive ? { active: true } : {};
    const rows = await this.db.plan.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { priceRub: 'asc' }]
    });
    return rows.map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      priceUsd: Number(row.priceUsd),
      priceRub: Number(row.priceRub),
      deviceLimit: row.deviceLimit,
      subtitle: row.subtitle ?? null,
      durationDays: row.durationDays,
      active: row.active,
      sortOrder: row.sortOrder
    }));
  }

  async getPlanById(planId: string): Promise<PlanRecord | null> {
    const row = await this.db.plan.findUnique({ where: { id: planId } });
    if (!row) return null;
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      priceUsd: Number(row.priceUsd),
      priceRub: Number(row.priceRub),
      deviceLimit: row.deviceLimit,
      subtitle: row.subtitle ?? null,
      durationDays: row.durationDays,
      active: row.active,
      sortOrder: row.sortOrder
    };
  }

  async createPendingPayment(input: {
    userId: string;
    planId: string;
    amountRub: number;
    currency: string;
    provider: string;
    metadata?: unknown;
  }): Promise<{ id: string }> {
    const row = await this.db.payment.create({
      data: {
        userId: input.userId,
        planId: input.planId,
        amountUsd: new Prisma.Decimal(0),
        amountRub: new Prisma.Decimal(input.amountRub),
        currency: input.currency,
        provider: input.provider,
        status: 'pending',
        metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
      }
    });
    return { id: row.id };
  }

  async setPaymentProviderPaymentId(localPaymentId: string, providerPaymentId: string): Promise<void> {
    await this.db.payment.update({
      where: { id: localPaymentId },
      data: { providerPaymentId }
    });
  }

  async getPaymentByProviderId(providerPaymentId: string): Promise<PaymentLookupRecord | null> {
    const row = await this.db.payment.findFirst({
      where: { providerPaymentId }
    });
    if (!row) return null;
    return {
      id: row.id,
      userId: row.userId,
      planId: row.planId,
      amountRub: Number(row.amountRub),
      status: row.status
    };
  }

  async claimPaymentAsPaidIfPending(providerPaymentId: string): Promise<PendingPaymentRecord | null> {
    return this.db.$transaction(async (tx) => {
      const res = await tx.payment.updateMany({
        where: { providerPaymentId, status: 'pending' },
        data: { status: 'paid' }
      });
      if (res.count !== 1) return null;
      const row = await tx.payment.findFirst({
        where: { providerPaymentId, status: 'paid' },
        select: { id: true, userId: true, planId: true }
      });
      return row ? { id: row.id, userId: row.userId, planId: row.planId } : null;
    });
  }

  async replaceActiveSubscriptionWithNewPlan(userId: string, planId: string): Promise<void> {
    await this.db.$transaction(async (tx) => {
      const plan = await tx.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        throw new Error(`Plan not found: ${planId}`);
      }
      const endsAt = new Date(Date.now() + plan.durationDays * 86_400_000);
      await tx.subscription.updateMany({
        where: { userId, status: 'active' },
        data: { status: 'expired' }
      });
      await tx.subscription.create({
        data: {
          userId,
          planId,
          status: 'active',
          startedAt: new Date(),
          endsAt
        }
      });
    });
  }

  async listReferralsByInviter(input: { userId: string }): Promise<ReferralRecord[]> {
    const rows = await this.db.referral.findMany({
      where: { inviterUserId: input.userId },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((row) => ({
      id: row.id,
      invitedUserId: row.invitedUserId,
      rewardGranted: row.rewardGranted,
      createdAt: row.createdAt
    }));
  }

  countReferrals(input: { userId: string; grantedOnly?: boolean }): Promise<number> {
    return this.db.referral.count({
      where: {
        inviterUserId: input.userId,
        ...(input.grantedOnly ? { rewardGranted: true } : {})
      }
    });
  }

  async listSupportRequests(input: { userId: string }): Promise<SupportRecord[]> {
    const rows = await this.db.supportRequest.findMany({
      where: { userId: input.userId },
      orderBy: { createdAt: 'desc' }
    });
    return rows.map((row) => ({
      id: row.id,
      subject: row.subject,
      status: row.status,
      createdAt: row.createdAt
    }));
  }

  countOpenSupport(input: { userId: string }): Promise<number> {
    return this.db.supportRequest.count({
      where: {
        userId: input.userId,
        status: { in: ['open', 'in_progress'] }
      }
    });
  }

  async getLatestActiveVpnAccessByUserId(userId: string): Promise<VpnAccessRecord | null> {
    const row = await this.db.vpnAccess.findFirst({
      where: { userId, status: 'active' },
      orderBy: { updatedAt: 'desc' }
    });
    if (!row) return null;
    return {
      status: row.status,
      provider: row.provider,
      accessType: row.accessType,
      value: row.value ?? null,
      qrValue: row.qrValue ?? null,
      configFileUrl: row.configFileUrl ?? null,
      deepLinkTemplate: row.deepLinkTemplate ?? null,
      externalAccessId: row.externalAccessId ?? null,
      planId: row.planId ?? null,
      expiresAt: row.expiresAt,
      deviceFingerprint: row.deviceFingerprint
    };
  }

  async countActiveVpnAccessByUserAndProvider(userId: string, provider: string): Promise<number> {
    return this.db.vpnAccess.count({
      where: { userId, provider, status: 'active' }
    });
  }

  async getVpnAccessByUserProviderDevice(
    userId: string,
    provider: string,
    deviceFingerprint: string
  ): Promise<VpnAccessPersistentRow | null> {
    const row = await this.db.vpnAccess.findUnique({
      where: {
        userId_provider_deviceFingerprint: {
          userId,
          provider,
          deviceFingerprint
        }
      }
    });
    if (!row) return null;
    return {
      userId: row.userId,
      provider: row.provider,
      deviceFingerprint: row.deviceFingerprint,
      status: row.status,
      accessType: row.accessType,
      value: row.value ?? null,
      qrValue: row.qrValue ?? null,
      configFileUrl: row.configFileUrl ?? null,
      deepLinkTemplate: row.deepLinkTemplate ?? null,
      externalAccessId: row.externalAccessId ?? null,
      planId: row.planId ?? null,
      expiresAt: row.expiresAt
    };
  }

  async listVpnDeviceSlots(userId: string, provider: string): Promise<VpnDeviceSlotRow[]> {
    const rows = await this.db.vpnAccess.findMany({
      where: { userId, provider },
      orderBy: { updatedAt: 'desc' }
    });
    return rows.map((r) => {
      const meta = (r.metadata ?? {}) as { devicePlatform?: string; deviceLabel?: string };
      return {
        deviceFingerprint: r.deviceFingerprint,
        platform: typeof meta.devicePlatform === 'string' ? meta.devicePlatform : null,
        label: typeof meta.deviceLabel === 'string' ? meta.deviceLabel : null,
        accessStatus: r.status,
        expiresAt: r.expiresAt
      };
    });
  }

  async listVpnAccessPersistentByUserAndProvider(
    userId: string,
    provider: string
  ): Promise<VpnAccessPersistentRow[]> {
    const rows = await this.db.vpnAccess.findMany({
      where: { userId, provider },
      orderBy: { updatedAt: 'desc' }
    });
    return rows.map((row) => ({
      userId: row.userId,
      provider: row.provider,
      deviceFingerprint: row.deviceFingerprint,
      status: row.status,
      accessType: row.accessType,
      value: row.value ?? null,
      qrValue: row.qrValue ?? null,
      configFileUrl: row.configFileUrl ?? null,
      deepLinkTemplate: row.deepLinkTemplate ?? null,
      externalAccessId: row.externalAccessId ?? null,
      planId: row.planId ?? null,
      expiresAt: row.expiresAt
    }));
  }

  async upsertVpnAccessRecord(input: UpsertVpnAccessInput): Promise<void> {
    const meta = input.metadata as Prisma.InputJsonValue;
    await this.db.vpnAccess.upsert({
      where: {
        userId_provider_deviceFingerprint: {
          userId: input.userId,
          provider: input.provider,
          deviceFingerprint: input.deviceFingerprint
        }
      },
      update: {
        planId: input.planId,
        accessType: input.accessType as $Enums.VpnAccessType,
        status: input.status as $Enums.VpnAccessStatus,
        externalAccessId: input.externalAccessId,
        value: input.value,
        qrValue: input.qrValue,
        configFileUrl: input.configFileUrl,
        deepLinkTemplate: input.deepLinkTemplate,
        expiresAt: input.expiresAt,
        metadata: meta
      },
      create: {
        userId: input.userId,
        planId: input.planId,
        provider: input.provider,
        deviceFingerprint: input.deviceFingerprint,
        accessType: input.accessType as $Enums.VpnAccessType,
        status: input.status as $Enums.VpnAccessStatus,
        externalAccessId: input.externalAccessId,
        value: input.value,
        qrValue: input.qrValue,
        configFileUrl: input.configFileUrl,
        deepLinkTemplate: input.deepLinkTemplate,
        expiresAt: input.expiresAt,
        metadata: meta
      }
    });
  }

  async upsertUserVpnDevice(_input: {
    userId: string;
    deviceFingerprint: string;
    platform: string;
    label: string | null;
  }): Promise<void> {
    // Prisma schema has no `vpn_devices` table; device metadata lives on `vpn_access.metadata`.
  }

  async revokeVpnAccessByUserProviderDevice(
    userId: string,
    provider: string,
    deviceFingerprint: string
  ): Promise<void> {
    await this.db.vpnAccess.updateMany({
      where: { userId, provider, deviceFingerprint },
      data: { status: 'revoked' }
    });
  }

  async updateAllVpnAccessForUser(userId: string, input: UpdateAllVpnAccessForUserInput): Promise<void> {
    await this.db.vpnAccess.updateMany({
      where: { userId },
      data: {
        planId: input.planId,
        accessType: input.accessType as $Enums.VpnAccessType,
        value: input.value,
        qrValue: input.qrValue,
        configFileUrl: input.configFileUrl,
        deepLinkTemplate: input.deepLinkTemplate,
        expiresAt: input.expiresAt,
        status: input.status as $Enums.VpnAccessStatus,
        metadata: input.metadata as Prisma.InputJsonValue
      }
    });
  }

  async revokeAllVpnAccessForUser(userId: string): Promise<void> {
    await this.db.vpnAccess.updateMany({
      where: { userId },
      data: { status: 'revoked' }
    });
  }

  async tryCreateSubscriptionNotificationRecord(input: {
    userId: string;
    subscriptionId: string;
    type: SubscriptionNotificationTypeName;
  }): Promise<boolean> {
    try {
      await this.db.subscriptionNotification.create({
        data: {
          userId: input.userId,
          subscriptionId: input.subscriptionId,
          type: input.type as $Enums.SubscriptionNotificationType
        }
      });
      return true;
    } catch (e: unknown) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        return false;
      }
      throw e;
    }
  }

  async listActiveSubscriptionsWithTelegramForReminders(): Promise<ActiveSubscriptionReminderRow[]> {
    const rows = await this.db.subscription.findMany({
      where: { status: 'active', endsAt: { gt: new Date() } },
      include: { user: true, plan: true }
    });
    return rows.map((r) => ({
      subscriptionId: r.id,
      userId: r.userId,
      telegramUserId: r.user.telegramUserId,
      planName: r.plan.name,
      endsAt: r.endsAt
    }));
  }

  async deleteSubscriptionNotificationRecord(
    subscriptionId: string,
    type: SubscriptionNotificationTypeName
  ): Promise<void> {
    await this.db.subscriptionNotification.deleteMany({
      where: {
        subscriptionId,
        type: type as $Enums.SubscriptionNotificationType
      }
    });
  }

  async checkReadiness(): Promise<{ ok: boolean; detail: string }> {
    await this.db.$queryRaw`SELECT 1`;
    return { ok: true, detail: 'prisma:ok' };
  }
}

class SupabaseDataLayer implements DataLayer {
  private readonly client: SupabaseClient;

  constructor(private readonly env: ApiEnv) {
    if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('Supabase data layer requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
    }
    this.client = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false }
    });
  }

  async getUserById(userId: string): Promise<AppUserRecord | null> {
    const { data, error } = await this.client
      .from('app_users')
      .select('id,telegram_user_id,username,first_name,last_name,email,referral_code,created_at')
      .eq('id', userId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      telegramUserId: data.telegram_user_id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email ?? null,
      referralCode: data.referral_code,
      createdAt: new Date(data.created_at)
    };
  }

  async getUserByTelegramId(telegramUserId: string): Promise<AppUserRecord | null> {
    const { data, error } = await this.client
      .from('app_users')
      .select('id,telegram_user_id,username,first_name,last_name,email,referral_code,created_at')
      .eq('telegram_user_id', telegramUserId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      telegramUserId: data.telegram_user_id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email ?? null,
      referralCode: data.referral_code,
      createdAt: new Date(data.created_at)
    };
  }

  async upsertUserByTelegramId(input: {
    telegramUserId: string;
    username: string | null;
    firstName: string | null;
    lastName: string | null;
    referralCode: string;
  }): Promise<AppUserRecord> {
    const { data, error } = await this.client
      .from('app_users')
      .upsert(
        {
          telegram_user_id: input.telegramUserId,
          username: input.username,
          first_name: input.firstName,
          last_name: input.lastName,
          referral_code: input.referralCode
        },
        { onConflict: 'telegram_user_id' }
      )
      .select('id,telegram_user_id,username,first_name,last_name,email,referral_code,created_at')
      .single();
    if (error) throw error;
    return {
      id: data.id,
      telegramUserId: data.telegram_user_id,
      username: data.username,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email ?? null,
      referralCode: data.referral_code,
      createdAt: new Date(data.created_at)
    };
  }

  async updateUserEmail(userId: string, email: string): Promise<void> {
    const { error } = await this.client.from('app_users').update({ email }).eq('id', userId);
    if (error) throw error;
  }

  async getActiveSubscriptionByUserId(userId: string): Promise<SubscriptionRecord | null> {
    const { data, error } = await this.client
      .from('app_subscriptions')
      .select(
        'id,user_id,status,ends_at,app_plans!inner(id,name,duration_days,device_limit)'
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('ends_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const plan = Array.isArray(data.app_plans) ? data.app_plans[0] : data.app_plans;
    if (!plan) return null;
    return {
      id: data.id,
      userId: data.user_id,
      status: data.status,
      endsAt: new Date(data.ends_at),
      plan: {
        id: plan.id,
        name: plan.name,
        durationDays: plan.duration_days,
        deviceLimit: typeof plan.device_limit === 'number' ? plan.device_limit : 0
      }
    };
  }

  async listPlans(input: { onlyActive: boolean }): Promise<PlanRecord[]> {
    let query = this.client
      .from('app_plans')
      .select('id,code,name,price_usd,price_rub,duration_days,is_active,device_limit,subtitle,sort_order')
      .order('sort_order', { ascending: true })
      .order('price_rub', { ascending: true });
    if (input.onlyActive) {
      query = query.eq('is_active', true);
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      code: row.code,
      name: row.name,
      priceUsd: Number(row.price_usd),
      priceRub: Number(row.price_rub ?? 0),
      deviceLimit: typeof row.device_limit === 'number' ? row.device_limit : 0,
      subtitle: row.subtitle ?? null,
      durationDays: row.duration_days,
      active: row.is_active,
      sortOrder: typeof row.sort_order === 'number' ? row.sort_order : 0
    }));
  }

  async getPlanById(planId: string): Promise<PlanRecord | null> {
    const { data, error } = await this.client
      .from('app_plans')
      .select('id,code,name,price_usd,price_rub,duration_days,is_active,device_limit,subtitle,sort_order')
      .eq('id', planId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      code: data.code,
      name: data.name,
      priceUsd: Number(data.price_usd),
      priceRub: Number(data.price_rub ?? 0),
      deviceLimit: typeof data.device_limit === 'number' ? data.device_limit : 0,
      subtitle: data.subtitle ?? null,
      durationDays: data.duration_days,
      active: data.is_active,
      sortOrder: typeof data.sort_order === 'number' ? data.sort_order : 0
    };
  }

  async createPendingPayment(input: {
    userId: string;
    planId: string;
    amountRub: number;
    currency: string;
    provider: string;
    metadata?: unknown;
  }): Promise<{ id: string }> {
    const now = new Date().toISOString();
    const { data, error } = await this.client
      .from('app_payments')
      .insert({
        user_id: input.userId,
        plan_id: input.planId,
        amount_usd: 0,
        amount_rub: input.amountRub,
        currency: input.currency,
        provider: input.provider,
        status: 'pending',
        metadata: (input.metadata ?? null) as Record<string, unknown> | null,
        created_at: now,
        updated_at: now
      })
      .select('id')
      .single();
    if (error) throw error;
    return { id: data.id };
  }

  async setPaymentProviderPaymentId(localPaymentId: string, providerPaymentId: string): Promise<void> {
    const { error } = await this.client
      .from('app_payments')
      .update({ provider_payment_id: providerPaymentId, updated_at: new Date().toISOString() })
      .eq('id', localPaymentId);
    if (error) throw error;
  }

  async getPaymentByProviderId(providerPaymentId: string): Promise<PaymentLookupRecord | null> {
    const { data, error } = await this.client
      .from('app_payments')
      .select('id,user_id,plan_id,amount_rub,status')
      .eq('provider_payment_id', providerPaymentId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      id: data.id,
      userId: data.user_id,
      planId: data.plan_id,
      amountRub: Number(data.amount_rub),
      status: data.status
    };
  }

  async claimPaymentAsPaidIfPending(providerPaymentId: string): Promise<PendingPaymentRecord | null> {
    const { data: updated, error: updErr } = await this.client
      .from('app_payments')
      .update({ status: 'paid', updated_at: new Date().toISOString() })
      .eq('provider_payment_id', providerPaymentId)
      .eq('status', 'pending')
      .select('id,user_id,plan_id')
      .maybeSingle();
    if (updErr) throw updErr;
    if (!updated) return null;
    return { id: updated.id, userId: updated.user_id, planId: updated.plan_id };
  }

  async replaceActiveSubscriptionWithNewPlan(userId: string, planId: string): Promise<void> {
    const plan = await this.getPlanById(planId);
    if (!plan) {
      throw new Error(`Plan not found: ${planId}`);
    }
    const endsAt = new Date(Date.now() + plan.durationDays * 86_400_000).toISOString();
    const now = new Date().toISOString();
    const { error: expErr } = await this.client
      .from('app_subscriptions')
      .update({ status: 'expired', updated_at: now })
      .eq('user_id', userId)
      .eq('status', 'active');
    if (expErr) throw expErr;
    const { error: insErr } = await this.client.from('app_subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      starts_at: now,
      ends_at: endsAt,
      created_at: now,
      updated_at: now
    });
    if (insErr) throw insErr;
  }

  async listReferralsByInviter(input: { userId: string }): Promise<ReferralRecord[]> {
    const { data, error } = await this.client
      .from('app_referrals')
      .select('id,invited_user_id,reward_granted,created_at')
      .eq('inviter_user_id', input.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      invitedUserId: row.invited_user_id,
      rewardGranted: row.reward_granted,
      createdAt: new Date(row.created_at)
    }));
  }

  async countReferrals(input: { userId: string; grantedOnly?: boolean }): Promise<number> {
    let query = this.client
      .from('app_referrals')
      .select('id', { count: 'exact', head: true })
      .eq('inviter_user_id', input.userId);
    if (input.grantedOnly) query = query.eq('reward_granted', true);
    const { count, error } = await query;
    if (error) throw error;
    return count ?? 0;
  }

  async listSupportRequests(input: { userId: string }): Promise<SupportRecord[]> {
    const { data, error } = await this.client
      .from('app_support_requests')
      .select('id,subject,status,created_at')
      .eq('user_id', input.userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      id: row.id,
      subject: row.subject,
      status: row.status,
      createdAt: new Date(row.created_at)
    }));
  }

  async countOpenSupport(input: { userId: string }): Promise<number> {
    const { count, error } = await this.client
      .from('app_support_requests')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', input.userId)
      .in('status', ['open', 'in_progress']);
    if (error) throw error;
    return count ?? 0;
  }

  async getLatestActiveVpnAccessByUserId(userId: string): Promise<VpnAccessRecord | null> {
    const { data, error } = await this.client
      .from('app_vpn_access_records')
      .select(
        'status,provider,access_type,value,qr_value,config_file_url,deep_link_template,external_access_id,plan_id,expires_at,device_fingerprint'
      )
      .eq('user_id', userId)
      .eq('status', 'active')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const base: VpnAccessRecord = {
      status: data.status,
      provider: data.provider,
      accessType: data.access_type,
      value: data.value ?? null,
      qrValue: data.qr_value ?? null,
      configFileUrl: data.config_file_url ?? null,
      deepLinkTemplate: data.deep_link_template ?? null,
      externalAccessId: data.external_access_id ?? null,
      planId: data.plan_id ?? null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null
    };
    if (typeof data.device_fingerprint === 'string') {
      base.deviceFingerprint = data.device_fingerprint;
    }
    return base;
  }

  async countActiveVpnAccessByUserAndProvider(userId: string, provider: string): Promise<number> {
    const { count, error } = await this.client
      .from('app_vpn_access_records')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('status', 'active');
    if (error) throw error;
    return count ?? 0;
  }

  async getVpnAccessByUserProviderDevice(
    userId: string,
    provider: string,
    deviceFingerprint: string
  ): Promise<VpnAccessPersistentRow | null> {
    const { data, error } = await this.client
      .from('app_vpn_access_records')
      .select(
        'user_id,plan_id,provider,device_fingerprint,access_type,status,external_access_id,value,qr_value,config_file_url,deep_link_template,expires_at'
      )
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('device_fingerprint', deviceFingerprint)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return {
      userId: data.user_id,
      provider: data.provider,
      deviceFingerprint: data.device_fingerprint,
      status: data.status,
      accessType: data.access_type,
      value: data.value ?? null,
      qrValue: data.qr_value ?? null,
      configFileUrl: data.config_file_url ?? null,
      deepLinkTemplate: data.deep_link_template ?? null,
      externalAccessId: data.external_access_id ?? null,
      planId: data.plan_id ?? null,
      expiresAt: data.expires_at ? new Date(data.expires_at) : null
    };
  }

  async listVpnDeviceSlots(userId: string, provider: string): Promise<VpnDeviceSlotRow[]> {
    const { data: accessRows, error: aErr } = await this.client
      .from('app_vpn_access_records')
      .select('device_fingerprint,status,expires_at,metadata')
      .eq('user_id', userId)
      .eq('provider', provider)
      .order('updated_at', { ascending: false });
    if (aErr) throw aErr;
    const { data: devRows, error: dErr } = await this.client
      .from('app_vpn_devices')
      .select('device_fingerprint,platform,label')
      .eq('user_id', userId);
    if (dErr) throw dErr;
    const devMap = new Map(
      (devRows ?? []).map((d) => [d.device_fingerprint, { platform: d.platform, label: d.label }])
    );
    return (accessRows ?? []).map((r) => {
      const dev = devMap.get(r.device_fingerprint);
      const meta = (r.metadata ?? {}) as { devicePlatform?: string; deviceLabel?: string };
      return {
        deviceFingerprint: r.device_fingerprint,
        platform: dev?.platform ?? (typeof meta.devicePlatform === 'string' ? meta.devicePlatform : null),
        label: dev?.label ?? (typeof meta.deviceLabel === 'string' ? meta.deviceLabel : null),
        accessStatus: r.status,
        expiresAt: r.expires_at ? new Date(r.expires_at) : null
      };
    });
  }

  async listVpnAccessPersistentByUserAndProvider(
    userId: string,
    provider: string
  ): Promise<VpnAccessPersistentRow[]> {
    const { data, error } = await this.client
      .from('app_vpn_access_records')
      .select(
        'user_id,plan_id,provider,device_fingerprint,access_type,status,external_access_id,value,qr_value,config_file_url,deep_link_template,expires_at'
      )
      .eq('user_id', userId)
      .eq('provider', provider)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data ?? []).map((row) => ({
      userId: row.user_id,
      provider: row.provider,
      deviceFingerprint: row.device_fingerprint,
      status: row.status,
      accessType: row.access_type,
      value: row.value ?? null,
      qrValue: row.qr_value ?? null,
      configFileUrl: row.config_file_url ?? null,
      deepLinkTemplate: row.deep_link_template ?? null,
      externalAccessId: row.external_access_id ?? null,
      planId: row.plan_id ?? null,
      expiresAt: row.expires_at ? new Date(row.expires_at) : null
    }));
  }

  async upsertVpnAccessRecord(input: UpsertVpnAccessInput): Promise<void> {
    const now = new Date().toISOString();
    const row = {
      user_id: input.userId,
      plan_id: input.planId,
      provider: input.provider,
      device_fingerprint: input.deviceFingerprint,
      access_type: input.accessType,
      status: input.status,
      external_access_id: input.externalAccessId,
      value: input.value,
      qr_value: input.qrValue,
      config_file_url: input.configFileUrl,
      deep_link_template: input.deepLinkTemplate,
      expires_at: input.expiresAt ? input.expiresAt.toISOString() : null,
      metadata: input.metadata as Record<string, unknown>,
      updated_at: now
    };
    const { error } = await this.client.from('app_vpn_access_records').upsert(row, {
      onConflict: 'user_id,provider,device_fingerprint'
    });
    if (error) throw error;
  }

  async upsertUserVpnDevice(input: {
    userId: string;
    deviceFingerprint: string;
    platform: string;
    label: string | null;
  }): Promise<void> {
    const now = new Date().toISOString();
    const { error } = await this.client.from('app_vpn_devices').upsert(
      {
        user_id: input.userId,
        device_fingerprint: input.deviceFingerprint,
        platform: input.platform,
        label: input.label,
        last_seen_at: now,
        updated_at: now
      },
      { onConflict: 'user_id,device_fingerprint' }
    );
    if (error) throw error;
  }

  async revokeVpnAccessByUserProviderDevice(
    userId: string,
    provider: string,
    deviceFingerprint: string
  ): Promise<void> {
    const { error } = await this.client
      .from('app_vpn_access_records')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('provider', provider)
      .eq('device_fingerprint', deviceFingerprint);
    if (error) throw error;
  }

  async updateAllVpnAccessForUser(userId: string, input: UpdateAllVpnAccessForUserInput): Promise<void> {
    const { error } = await this.client
      .from('app_vpn_access_records')
      .update({
        plan_id: input.planId,
        access_type: input.accessType,
        value: input.value,
        qr_value: input.qrValue,
        config_file_url: input.configFileUrl,
        deep_link_template: input.deepLinkTemplate,
        expires_at: input.expiresAt ? input.expiresAt.toISOString() : null,
        status: input.status,
        metadata: input.metadata as Record<string, unknown>,
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId);
    if (error) throw error;
  }

  async revokeAllVpnAccessForUser(userId: string): Promise<void> {
    const { error } = await this.client
      .from('app_vpn_access_records')
      .update({ status: 'revoked', updated_at: new Date().toISOString() })
      .eq('user_id', userId);
    if (error) throw error;
  }

  async tryCreateSubscriptionNotificationRecord(input: {
    userId: string;
    subscriptionId: string;
    type: SubscriptionNotificationTypeName;
  }): Promise<boolean> {
    const now = new Date().toISOString();
    const { error } = await this.client.from('app_subscription_notifications').insert({
      user_id: input.userId,
      subscription_id: input.subscriptionId,
      type: input.type,
      sent_at: now
    });
    if (error) {
      if (error.code === '23505') {
        return false;
      }
      throw error;
    }
    return true;
  }

  async listActiveSubscriptionsWithTelegramForReminders(): Promise<ActiveSubscriptionReminderRow[]> {
    const { data, error } = await this.client
      .from('app_subscriptions')
      .select('id,user_id,ends_at,app_users(telegram_user_id),app_plans(name)')
      .eq('status', 'active')
      .gt('ends_at', new Date().toISOString());
    if (error) throw error;
    return (data ?? []).map((row: Record<string, unknown>) => {
      const rawUser = row.app_users as { telegram_user_id: string } | { telegram_user_id: string }[] | null | undefined;
      const user = Array.isArray(rawUser) ? rawUser[0] : rawUser;
      const rawPlan = row.app_plans as { name: string } | { name: string }[] | null | undefined;
      const plan = Array.isArray(rawPlan) ? rawPlan[0] : rawPlan;
      return {
        subscriptionId: row.id as string,
        userId: row.user_id as string,
        telegramUserId: user?.telegram_user_id ?? '',
        planName: plan?.name ?? '',
        endsAt: new Date(row.ends_at as string)
      };
    });
  }

  async deleteSubscriptionNotificationRecord(
    subscriptionId: string,
    type: SubscriptionNotificationTypeName
  ): Promise<void> {
    const { error } = await this.client
      .from('app_subscription_notifications')
      .delete()
      .eq('subscription_id', subscriptionId)
      .eq('type', type);
    if (error) throw error;
  }

  async checkReadiness(): Promise<{ ok: boolean; detail: string }> {
    const { error } = await this.client.from('app_users').select('id', { head: true, count: 'exact' }).limit(1);
    if (error) throw error;
    return { ok: true, detail: 'supabase:ok' };
  }
}

export function createDataLayer(input: {
  env: ApiEnv;
  prisma: PrismaClient;
}): DataLayer {
  if (input.env.DATA_LAYER === 'supabase') {
    return new SupabaseDataLayer(input.env);
  }
  return new PrismaDataLayer(input.prisma);
}
