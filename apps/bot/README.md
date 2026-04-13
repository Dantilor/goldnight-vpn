# Telegram Bot

Telegraf bot for Mini App entrypoint and operator-friendly user status snapshots.

Role in v2 architecture: launcher-only runtime for Mini App entry UX.
Core business/auth logic stays in `apps/api` + data layer.

## Structure

```txt
src/
  bot.ts
  index.ts
  commands/
    start.ts
    help.ts
    profile.ts
  handlers/
    main-actions.ts
  services/
    backend-client.ts
  constants/
    buttons.ts
    messages.ts
  keyboards/
    main-keyboard.ts
```

## Commands

- `/start`
- `/help`
- `/profile`

## Bot Menu + Keyboard

- Persistent menu button opens Mini App (`/home`)
- Main keyboard:
  - Open App
  - My Subscription
  - Setup VPN
  - Help
  - Referrals

## Backend Integration

- Bot reads state from backend endpoint:
  - `GET /bot/users/:telegramUserId/summary`
- Auth header:
  - `x-bot-key: <BOT_API_KEY>`

## Local Run

```bash
pnpm --filter @goldnight/bot dev
```

Bot runtime is optional for Mini App development.
Mini App stack (web + api) can run without starting this process.

## Telegram menu button note

Mini App launch from the lower-left Telegram menu button is configured via bot API calls,
but for production you should also verify BotFather Main Mini App / menu settings for this bot.
