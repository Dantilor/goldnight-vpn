import type { FastifyReply, FastifyRequest } from 'fastify';
import { z } from 'zod';
import type { ApiEnv } from '@goldnight/config';
import { TokenService } from './token-service.js';
import type { DataLayer } from '../../lib/data-layer.js';

const bearerSchema = z.string().regex(/^Bearer\s+.+$/i);

export interface AuthenticatedUser {
  id: string;
  telegramUserId: string;
}

declare module 'fastify' {
  interface FastifyRequest {
    authUser?: AuthenticatedUser;
  }
}

export function createRequireAuth(input: { env: ApiEnv; dataLayer: DataLayer }) {
  const tokenService = new TokenService(input.env);

  return async function requireAuth(request: FastifyRequest, reply: FastifyReply) {
    const parsedHeader = bearerSchema.safeParse(request.headers.authorization);
    if (!parsedHeader.success) {
      return reply.code(401).send({ message: 'Missing or invalid Authorization header' });
    }

    const token = parsedHeader.data.replace(/^Bearer\s+/i, '');

    let claims: { sub: string; telegramUserId: string };
    try {
      claims = tokenService.verify(token);
    } catch {
      return reply.code(401).send({ message: 'Invalid or expired auth token' });
    }

    const user = await input.dataLayer.getUserById(claims.sub);

    if (!user || user.telegramUserId !== claims.telegramUserId) {
      return reply.code(401).send({ message: 'Auth user was not found' });
    }

    request.authUser = {
      id: user.id,
      telegramUserId: user.telegramUserId
    };
  };
}
