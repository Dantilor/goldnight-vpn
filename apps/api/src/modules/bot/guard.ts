import type { FastifyReply, FastifyRequest } from 'fastify';
import type { ApiEnv } from '@goldnight/config';

export function createBotGuard(env: ApiEnv) {
  return async function botGuard(request: FastifyRequest, reply: FastifyReply) {
    const botKey = request.headers['x-bot-key'];
    if (typeof botKey !== 'string' || botKey !== env.BOT_API_KEY) {
      return reply.code(401).send({ message: 'Bot access denied' });
    }
  };
}
