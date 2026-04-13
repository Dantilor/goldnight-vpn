# API Contract

Base URL: `http://localhost:3000`

## Public Endpoints

### `GET /health`
- Response: `{ ok: true }`

### `POST /auth/telegram`
- Body:
```json
{
  "initData": "query_id=...&user=...&auth_date=...&hash=..."
}
```
- Response:
```json
{
  "user": {
    "id": "cuid",
    "telegramUserId": "123456",
    "username": "user",
    "firstName": "Name",
    "lastName": "Last",
    "referralCode": "ref_123456"
  },
  "token": "jwt_token",
  "subscription": {
    "id": "cuid",
    "status": "active",
    "endsAt": "2026-01-01T00:00:00.000Z",
    "plan": {
      "id": "cuid",
      "name": "Standard Monthly",
      "durationDays": 30
    }
  }
}
```

### `GET /plans`
- Response: list of active plans with numeric `priceUsd`

## Protected Endpoints

All endpoints below require:
`Authorization: Bearer <token>`

### `GET /me`
Returns authenticated user profile.

### `GET /me/subscription`
Returns current active subscription or `null`.

### `GET /me/vpn-access`
Returns current VPN access for authenticated user or `null`.

Response shape:
```json
{
  "userId": "ck_user_id",
  "provider": "manual",
  "accessType": "subscription_url",
  "value": "https://provider.example/subscription/abc",
  "qrValue": "vpn://qr/abc",
  "configFileUrl": "https://provider.example/config/abc.conf",
  "deepLinkTemplate": "wireguard://import?platform={platform}&client={client}",
  "expiresAt": "2026-12-31T00:00:00.000Z",
  "status": "active"
}
```

### `POST /me/vpn/connect-payload`
- Body:
```json
{
  "platform": "ios",
  "client": "wireguard"
}
```
- Response: provider payload for client setup.

## Admin Manual Access Endpoints

Require header:
`x-admin-key: <ADMIN_API_KEY>`

- `POST /admin/vpn-access`
- `GET /admin/vpn-access/user/:userId`
- `PATCH /admin/vpn-access/:accessId`
- `POST /admin/vpn-access/:accessId/renew`
- `POST /admin/vpn-access/:accessId/revoke`

## Bot Service Endpoint

Requires header:
`x-bot-key: <BOT_API_KEY>`

### `GET /bot/users/:telegramUserId/summary`

Returns compact user snapshot for bot commands/buttons:

- user identity fields
- current subscription summary
- current vpn access summary
- referrals summary
- support summary

### `GET /me/referrals`
Returns referrals for authenticated inviter.

### `GET /me/support`
Returns support requests for authenticated user.

## Not Implemented

- Payments business flow. `GET /payments/status` responds with `501`.
