import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { createAdminGuard } from './guard.js';
import {
  accessIdParamsSchema,
  createManualAccessSchema,
  renewAccessSchema,
  updateManualAccessSchema,
  userIdParamsSchema
} from './schemas.js';
import { AdminVpnAccessService } from './service.js';

export async function registerAdminRoutes(app: FastifyInstance, ctx: AppContext) {
  const adminGuard = createAdminGuard(ctx.env);
  const service = new AdminVpnAccessService(ctx.db);
  const isSupabaseMode = ctx.env.DATA_LAYER === 'supabase';

  app.post('/admin/vpn-access', { preHandler: [adminGuard] }, async (request, reply) => {
    if (isSupabaseMode) {
      return reply.code(501).send({
        message:
          'Admin VPN write-path is legacy Prisma-only and is not supported in DATA_LAYER=supabase mode yet'
      });
    }
    const body = createManualAccessSchema.parse(request.body);
    const created = await service.createManualAccess({
      userId: body.userId,
      provider: body.provider,
      accessType: body.accessType,
      ...(body.planId !== undefined ? { planId: body.planId } : {}),
      ...(body.value !== undefined ? { value: body.value } : {}),
      ...(body.qrValue !== undefined ? { qrValue: body.qrValue } : {}),
      ...(body.configFileUrl !== undefined ? { configFileUrl: body.configFileUrl } : {}),
      ...(body.deepLinkTemplate !== undefined ? { deepLinkTemplate: body.deepLinkTemplate } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.metadata !== undefined ? { metadata: body.metadata } : {})
    });
    return reply.code(201).send(created);
  });

  app.get('/admin/vpn-access/user/:userId', { preHandler: [adminGuard] }, async (request, reply) => {
    if (isSupabaseMode) {
      return reply.code(501).send({
        message:
          'Admin VPN read/write path is legacy Prisma-only and is not supported in DATA_LAYER=supabase mode yet'
      });
    }
    const params = userIdParamsSchema.parse(request.params);
    return service.getCurrentManualAccessByUser(params.userId);
  });

  app.patch('/admin/vpn-access/:accessId', { preHandler: [adminGuard] }, async (request, reply) => {
    if (isSupabaseMode) {
      return reply.code(501).send({
        message:
          'Admin VPN write-path is legacy Prisma-only and is not supported in DATA_LAYER=supabase mode yet'
      });
    }
    const params = accessIdParamsSchema.parse(request.params);
    const body = updateManualAccessSchema.parse(request.body);
    return service.updateManualAccess(params.accessId, {
      ...(body.planId !== undefined ? { planId: body.planId } : {}),
      ...(body.accessType !== undefined ? { accessType: body.accessType } : {}),
      ...(body.value !== undefined ? { value: body.value } : {}),
      ...(body.qrValue !== undefined ? { qrValue: body.qrValue } : {}),
      ...(body.configFileUrl !== undefined ? { configFileUrl: body.configFileUrl } : {}),
      ...(body.deepLinkTemplate !== undefined ? { deepLinkTemplate: body.deepLinkTemplate } : {}),
      ...(body.status !== undefined ? { status: body.status } : {}),
      ...(body.expiresAt !== undefined ? { expiresAt: body.expiresAt } : {}),
      ...(body.notes !== undefined ? { notes: body.notes } : {}),
      ...(body.metadata !== undefined ? { metadata: body.metadata } : {})
    });
  });

  app.post('/admin/vpn-access/:accessId/renew', { preHandler: [adminGuard] }, async (request, reply) => {
    if (isSupabaseMode) {
      return reply.code(501).send({
        message:
          'Admin VPN write-path is legacy Prisma-only and is not supported in DATA_LAYER=supabase mode yet'
      });
    }
    const params = accessIdParamsSchema.parse(request.params);
    const body = renewAccessSchema.parse(request.body);
    return service.renewAccess(params.accessId, body.expiresAt);
  });

  app.post('/admin/vpn-access/:accessId/revoke', { preHandler: [adminGuard] }, async (request, reply) => {
    if (isSupabaseMode) {
      return reply.code(501).send({
        message:
          'Admin VPN write-path is legacy Prisma-only and is not supported in DATA_LAYER=supabase mode yet'
      });
    }
    const params = accessIdParamsSchema.parse(request.params);
    return service.revokeAccess(params.accessId);
  });
}
