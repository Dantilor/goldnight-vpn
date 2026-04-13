# VPN Provider Integration

## Path A Provider Strategy

Golden Night VPN uses provider abstraction so business and UI layers remain decoupled:

- `VpnProvider` interface
- `MockVpnProvider` for development
- `ManualVpnProvider` as launch fallback when external API is not ready
- `RealVpnProvider` placeholder for future provider API

Provider mode is controlled by `VPN_PROVIDER`:

- `mock`
- `manual`
- `real`

## Manual Provider Behavior

`ManualVpnProvider` does not generate VPN credentials.
It only reads DB-managed access records (`vpn_access` where `provider = "manual"`).

User routes continue to use `VpnService`:

- `GET /me/vpn-access`
- `POST /me/vpn/connect-payload`

This keeps user flow stable while allowing operator-managed launch.

## Access Types

Supported access types:

- `subscription_url`
- `plain_text_key`
- `config_download`
- `deep_link`
- `qr_only`

`deepLinkTemplate` supports placeholders:

- `{platform}`
- `{client}`
