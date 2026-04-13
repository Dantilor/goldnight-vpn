import { Prisma } from '@prisma/client';
import type { PrismaClient, VpnAccess } from '@prisma/client';

function toNullableJsonValue(value: Record<string, unknown> | undefined): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }
  return value as Prisma.InputJsonValue;
}

export class AdminVpnAccessService {
  constructor(private readonly db: PrismaClient) {}

  async createManualAccess(input: {
    userId: string;
    planId?: string;
    provider: string;
    accessType: VpnAccess['accessType'];
    value?: string;
    qrValue?: string;
    configFileUrl?: string;
    deepLinkTemplate?: string;
    expiresAt?: string;
    notes?: string;
    metadata?: Record<string, unknown>;
  }) {
    const updateData: Prisma.VpnAccessUncheckedUpdateInput = {
      accessType: input.accessType,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      issuedAt: new Date(),
      status: 'active'
    };
    const createData: Prisma.VpnAccessUncheckedCreateInput = {
      userId: input.userId,
      provider: input.provider,
      deviceFingerprint: '__default__',
      accessType: input.accessType,
      expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
      issuedAt: new Date(),
      status: 'active'
    };

    if (input.planId !== undefined) {
      updateData.planId = input.planId;
      createData.planId = input.planId;
    }
    if (input.value !== undefined) {
      updateData.value = input.value;
      createData.value = input.value;
    }
    if (input.qrValue !== undefined) {
      updateData.qrValue = input.qrValue;
      createData.qrValue = input.qrValue;
    }
    if (input.configFileUrl !== undefined) {
      updateData.configFileUrl = input.configFileUrl;
      createData.configFileUrl = input.configFileUrl;
    }
    if (input.deepLinkTemplate !== undefined) {
      updateData.deepLinkTemplate = input.deepLinkTemplate;
      createData.deepLinkTemplate = input.deepLinkTemplate;
    }
    if (input.notes !== undefined) {
      updateData.notes = input.notes;
      createData.notes = input.notes;
    }
    if (input.metadata !== undefined) {
      const metadata = toNullableJsonValue(input.metadata);
      if (metadata !== undefined) {
        updateData.metadata = metadata;
        createData.metadata = metadata;
      }
    }

    return this.db.vpnAccess.upsert({
      where: {
        userId_provider_deviceFingerprint: {
          userId: input.userId,
          provider: input.provider,
          deviceFingerprint: '__default__'
        }
      },
      update: updateData,
      create: createData
    });
  }

  async updateManualAccess(accessId: string, input: {
    planId?: string;
    accessType?: VpnAccess['accessType'];
    value?: string | null;
    qrValue?: string | null;
    configFileUrl?: string | null;
    deepLinkTemplate?: string | null;
    status?: VpnAccess['status'];
    expiresAt?: string | null;
    notes?: string | null;
    metadata?: Record<string, unknown>;
  }) {
    const data: Prisma.VpnAccessUncheckedUpdateInput = {};
    if (input.planId !== undefined) {
      data.planId = input.planId;
    }
    if (input.accessType !== undefined) {
      data.accessType = input.accessType;
    }
    if (input.value !== undefined) {
      data.value = input.value;
    }
    if (input.qrValue !== undefined) {
      data.qrValue = input.qrValue;
    }
    if (input.configFileUrl !== undefined) {
      data.configFileUrl = input.configFileUrl;
    }
    if (input.deepLinkTemplate !== undefined) {
      data.deepLinkTemplate = input.deepLinkTemplate;
    }
    if (input.status !== undefined) {
      data.status = input.status;
    }
    if (input.expiresAt !== undefined) {
      data.expiresAt = input.expiresAt ? new Date(input.expiresAt) : null;
    }
    if (input.notes !== undefined) {
      data.notes = input.notes;
    }
    if (input.metadata !== undefined) {
      const metadata = toNullableJsonValue(input.metadata);
      if (metadata !== undefined) {
        data.metadata = metadata;
      }
    }

    return this.db.vpnAccess.update({
      where: { id: accessId },
      data
    });
  }

  async renewAccess(accessId: string, expiresAt: string) {
    return this.db.vpnAccess.update({
      where: { id: accessId },
      data: {
        expiresAt: new Date(expiresAt),
        status: 'active'
      }
    });
  }

  async revokeAccess(accessId: string) {
    return this.db.vpnAccess.update({
      where: { id: accessId },
      data: { status: 'revoked' }
    });
  }

  async getCurrentManualAccessByUser(userId: string) {
    return this.db.vpnAccess.findFirst({
      where: { userId, provider: 'manual' },
      orderBy: { updatedAt: 'desc' }
    });
  }
}
