# Manual Access Operations

## Purpose

Manual mode is a launch-critical fallback for Path A when provider API is unavailable.
Operators assign and maintain VPN access records directly from backend admin endpoints.

## Required Environment

In `apps/api/.env`:

- `VPN_PROVIDER=manual`
- `ADMIN_API_KEY=<secure value>`

## Admin Auth Guard

Current placeholder guard:

- Header: `x-admin-key: <ADMIN_API_KEY>`

Routes are isolated under `/admin/*`.

## Endpoints

### Create or replace manual access

`POST /admin/vpn-access`

Example:

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
  "notes": "Assigned by operator",
  "metadata": {
    "ticketId": "SUP-101"
  }
}
```

### View current manual access for user

`GET /admin/vpn-access/user/:userId`

### Update or replace fields

`PATCH /admin/vpn-access/:accessId`

### Renew expiration

`POST /admin/vpn-access/:accessId/renew`

Body:

```json
{
  "expiresAt": "2027-01-31T00:00:00.000Z"
}
```

### Revoke

`POST /admin/vpn-access/:accessId/revoke`

## User Experience

If access exists and is active:
- Connect screen shows actions by `accessType`.

If access is missing:
- Connect screen shows graceful empty state.

If access is expired/revoked:
- Connect screen shows status and fallback guidance.
