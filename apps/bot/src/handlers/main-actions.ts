import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.js';
import { MESSAGES } from '../constants/messages.js';
import { appUrl } from '../lib/mini-app-url.js';
import type { BackendClient } from '../services/backend-client.js';

export async function handleMainAction(input: {
  ctx: Context;
  text: string;
  backendClient: BackendClient;
  miniAppUrl: string;
}) {
  const telegramUserId = String(input.ctx.from?.id ?? '');

  if (input.text === BUTTONS.openApp) {
    await input.ctx.reply(
      'Откройте Golden Night VPN в мини-приложении.',
      Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, appUrl(input.miniAppUrl, '/'))])
    );
    return;
  }

  if (!telegramUserId) {
    await input.ctx.reply(
      `${MESSAGES.notLinked}\n\nНажмите «${BUTTONS.openApp}».`,
      Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, appUrl(input.miniAppUrl, '/'))])
    );
    return;
  }

  let summary = null;
  try {
    summary = await input.backendClient.getUserSummary(telegramUserId);
  } catch (error) {
    console.error('Bot main action summary lookup failed', error);
  }
  if (!summary) {
    await input.ctx.reply(
      `${MESSAGES.newUser}\n${MESSAGES.notLinked}`,
      Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, appUrl(input.miniAppUrl, '/'))])
    );
    return;
  }

  if (input.text === BUTTONS.mySubscription) {
    if (!summary.subscription) {
      await input.ctx.reply(
        `${MESSAGES.noSubscription}\n\nОткройте приложение, чтобы выбрать план.`,
        Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, appUrl(input.miniAppUrl, '/plans'))])
      );
      return;
    }
    await input.ctx.reply(
      `Подписка: ${summary.subscription.planName}\nСтатус: ${summary.subscription.status}\nАктивна до: ${new Date(summary.subscription.endsAt).toLocaleDateString()}`
    );
    return;
  }

  if (input.text === BUTTONS.setupVpn) {
    const hasActive = summary.access && summary.access.status === 'active';
    const setupUrl = appUrl(input.miniAppUrl, '/connect');
    if (!hasActive) {
      await input.ctx.reply(
        `${MESSAGES.noAccess}\nОткройте раздел подключения в мини-приложении.`,
        Markup.inlineKeyboard([Markup.button.webApp('Открыть подключение', setupUrl)])
      );
      return;
    }
    await input.ctx.reply(
      'Откройте раздел подключения в мини-приложении.',
      Markup.inlineKeyboard([Markup.button.webApp('Открыть подключение', setupUrl)])
    );
    return;
  }

  if (input.text === BUTTONS.referrals) {
    await input.ctx.reply(
      `Рефералы: ${summary.referrals.total}\nНачислено бонусов: ${summary.referrals.granted}\nОткройте раздел приглашений в мини-приложении.`,
      Markup.inlineKeyboard([
        Markup.button.webApp('Открыть приглашения', appUrl(input.miniAppUrl, '/referrals'))
      ])
    );
    return;
  }

  if (input.text === BUTTONS.help) {
    await input.ctx.reply(
      `${MESSAGES.help}\n\n${MESSAGES.support}`,
      Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, appUrl(input.miniAppUrl, '/'))])
    );
  }
}
