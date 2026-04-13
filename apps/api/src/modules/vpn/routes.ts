import type { FastifyInstance } from 'fastify';
import type { AppContext } from '../../app-context.js';
import { DeviceLimitReachedError, SubscriptionRequiredError } from './vpn-service.js';
import {
  connectPayloadBodySchema,
  provisionVpnBodySchema,
  revokeVpnBodySchema,
  vpnAccessQuerySchema
} from './schemas.js';

export async function registerVpnRoutes(app: FastifyInstance, ctx: AppContext) {
  app.get('/me/vpn-access', { preHandler: [ctx.requireAuth] }, async (request, reply) => {
    const q = vpnAccessQuerySchema.safeParse(request.query);
    if (!q.success) {
      return reply.code(400).send({ message: 'deviceFingerprint query parameter is required and must be valid.' });
    }
    return ctx.vpnService.getUserAccess(request.authUser!.id, q.data.deviceFingerprint);
  });

  app.get('/me/vpn/devices', { preHandler: [ctx.requireAuth] }, async (request) =>
    ctx.vpnService.listDeviceSlots(request.authUser!.id)
  );

  app.post('/me/vpn/provision', { preHandler: [ctx.requireAuth] }, async (request, reply) => {
    const body = provisionVpnBodySchema.parse(request.body ?? {});
    try {
      const access = await ctx.vpnService.provisionMyVpn(request.authUser!.id, {
        deviceFingerprint: body.deviceFingerprint,
        platform: body.platform,
        label: body.label ?? null
      });
      return reply.code(201).send(access);
    } catch (err) {
      if (err instanceof SubscriptionRequiredError) {
        return reply.code(403).send({ message: 'Active subscription required to provision VPN access.' });
      }
      if (err instanceof DeviceLimitReachedError) {
        return reply.code(409).send({
          message: 'DEVICE_LIMIT_REACHED',
          code: 'DEVICE_LIMIT_REACHED'
        });
      }
      throw err;
    }
  });

  app.post('/me/vpn/revoke', { preHandler: [ctx.requireAuth] }, async (request, reply) => {
    const body = revokeVpnBodySchema.parse(request.body ?? {});
    await ctx.vpnService.revokeMyVpn(request.authUser!.id, {
      ...(body.deviceFingerprint ? { deviceFingerprint: body.deviceFingerprint } : {})
    });
    return reply.code(204).send();
  });

  app.post('/me/vpn/connect-payload', { preHandler: [ctx.requireAuth] }, async (request, reply) => {
    const body = connectPayloadBodySchema.parse(request.body ?? {});
    try {
      return await ctx.vpnService.getConnectPayload({
        userId: request.authUser!.id,
        platform: body.platform,
        client: body.client,
        deviceFingerprint: body.deviceFingerprint
      });
    } catch (err) {
      if (err instanceof SubscriptionRequiredError) {
        return reply.code(403).send({ message: 'Active subscription required for VPN connect payload.' });
      }
      throw err;
    }
  });
}
