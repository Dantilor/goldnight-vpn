# Bot Flow

## Role

Telegram bot is the entry point to Golden Night VPN Mini App.
It does not implement business logic directly; it consumes backend bot service endpoints.

## Main Flow

1. User opens bot and runs `/start`.
2. Bot shows concise product intro and persistent action keyboard.
3. User taps **Open App** (WebApp button) to launch Mini App.
4. Mini App performs Telegram auth and token flow.
5. Bot commands/buttons query backend summary endpoint for status snapshots.

## Commands

- `/start` - intro and quick actions
- `/help` - usage and support guidance
- `/profile` - account, subscription, access, referral code summary

## Main Buttons

- Open App
- My Subscription
- Setup VPN
- Help
- Referrals

## Backend Contract

Bot calls:

- `GET /bot/users/:telegramUserId/summary`

with:

- Header `x-bot-key: <BOT_API_KEY>`

## Security

- Bot-to-backend access is protected by dedicated key (`BOT_API_KEY`).
- User-scoped bot responses are derived by Telegram `from.id`.
- Bot remains read-only for product state in current phase.
