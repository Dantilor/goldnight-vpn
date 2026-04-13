import jwt from 'jsonwebtoken';
import type { ApiEnv } from '@goldnight/config';

export interface AppTokenClaims {
  sub: string;
  telegramUserId: string;
}

export class TokenService {
  constructor(private readonly env: ApiEnv) {}

  sign(claims: AppTokenClaims): string {
    return jwt.sign(claims, this.env.AUTH_JWT_SECRET, {
      algorithm: 'HS256',
      expiresIn: this.env.AUTH_TOKEN_TTL_SECONDS
    });
  }

  verify(token: string): AppTokenClaims {
    const decoded = jwt.verify(token, this.env.AUTH_JWT_SECRET, {
      algorithms: ['HS256']
    });

    if (!decoded || typeof decoded !== 'object') {
      throw new Error('Invalid auth token payload');
    }

    const sub = decoded.sub;
    const telegramUserId = decoded.telegramUserId;

    if (typeof sub !== 'string' || typeof telegramUserId !== 'string') {
      throw new Error('Invalid auth token claims');
    }

    return { sub, telegramUserId };
  }
}
