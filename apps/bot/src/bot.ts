import type { BotEnv } from '@goldnight/config';
import { Telegraf } from 'telegraf';
import { BUTTONS } from './constants/buttons.js';
import { appUrl } from './lib/mini-app-url.js';
import { BackendClient } from './services/backend-client.js';
import { WelcomeSentStore } from './services/welcome-sent-store.js';
import { handleStart } from './commands/start.js';
import { handleHelp } from './commands/help.js';
import { handleProfile } from './commands/profile.js';
import { handleMainAction } from './handlers/main-actions.js';

export function createBot(env: BotEnv) {
  const bot = new Telegraf(env.TELEGRAM_BOT_TOKEN);
  const backendClient = new BackendClient(env);
  const welcomeSentStore = new WelcomeSentStore();

  bot.start((ctx) => handleStart({ ctx, welcomeSentStore, miniAppUrl: env.MINI_APP_URL }));
  bot.help((ctx) => handleHelp(ctx, env.MINI_APP_URL));
  bot.command('help', (ctx) => handleHelp(ctx, env.MINI_APP_URL));
  bot.command('profile', (ctx) => handleProfile(ctx, backendClient, env.MINI_APP_URL));

  bot.hears(
    [BUTTONS.openApp, BUTTONS.mySubscription, BUTTONS.setupVpn, BUTTONS.help, BUTTONS.referrals],
    (ctx) =>
      handleMainAction({
        ctx,
        text: ctx.message.text,
        backendClient,
        miniAppUrl: env.MINI_APP_URL
      })
  );

  bot.telegram.setMyCommands([
    { command: 'start', description: 'Запуск и главное меню' },
    { command: 'help', description: 'Как пользоваться ботом' },
    { command: 'profile', description: 'Мой аккаунт и статус' }
  ]);

  bot.telegram.setChatMenuButton({
    menuButton: {
      type: 'web_app',
      text: 'Подключение',
      web_app: {
        url: appUrl(env.MINI_APP_URL, '/')
      }
    }
  });

  bot.catch((error) => {
    console.error('Bot error', error);
  });

  return bot;
}
