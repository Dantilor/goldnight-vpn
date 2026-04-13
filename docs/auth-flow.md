# Auth Flow

## Overview

Golden Night VPN Mini App authentication uses Telegram WebApp `initData` verification on backend.

1. Frontend reads `window.Telegram.WebApp.initData`.
2. Frontend calls `POST /auth/telegram`.
3. Backend validates signature with Telegram bot token.
4. Backend upserts user in PostgreSQL.
5. Backend returns signed app token + normalized user payload + current subscription summary.
6. Frontend stores token and sends `Authorization: Bearer <token>` for protected endpoints.

## Telegram Signature Validation

- Backend builds `data_check_string` from all `initData` fields except `hash` (sorted by key).
- Secret key: `HMAC_SHA256("WebAppData", TELEGRAM_BOT_TOKEN)`.
- Expected hash: `HMAC_SHA256(data_check_string, secret_key)`.
- Request is rejected if hash mismatch or stale `auth_date`.

## Protected API Contract

- Middleware validates bearer token signature and expiry.
- Middleware resolves authenticated user and injects `request.authUser`.
- Protected routes must derive user from token context only.
- Frontend must never send arbitrary `userId` for user-scoped reads.

## Local Development

- In Telegram client: real `initData` is available automatically.
- Outside Telegram: app shows unauthenticated fallback and requires Telegram launch context.

## Error States

- `outside telegram`: frontend does not call `/auth/telegram` without `initData`.
- `invalid initData`: backend returns `401 Telegram authentication failed`.
- `auth unavailable`: backend returns `503 Telegram authentication is not configured on server`.
- `session expired`: frontend clears token and requests re-auth if protected `/me*` returns `401`.
- `network error`: frontend shows retry state and asks to verify API availability.
