import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { MESSAGES } from '../constants/messages.js';
import type { BackendClient } from '../services/backend-client.js';
import { BUTTONS } from '../constants/buttons.js';

export async function handleProfile(ctx: Context, backendClient: BackendClient, miniAppUrl: string) {
  const telegramUserId = String(ctx.from?.id ?? '');
  if (!telegramUserId) {
    await ctx.reply(
      `${MESSAGES.newUser}\n${MESSAGES.notLinked}`,
      Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, miniAppUrl)])
    );
    return;
  }

  let summary = null;
  try {
    summary = await backendClient.getUserSummary(telegramUserId);
  } catch (error) {
    console.error('Bot profile summary lookup failed', error);
  }

  if (!summary) {
    await ctx.reply(
      `${MESSAGES.newUser}\n${MESSAGES.notLinked}\n\nНажмите «${BUTTONS.openApp}», чтобы активировать аккаунт.`,
      Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, miniAppUrl)])
    );
    return;
  }

  const username = summary.user.username ? `@${summary.user.username}` : summary.user.firstName ?? 'Пользователь';
  const subscription = summary.subscription
    ? `${summary.subscription.planName} · ${summary.subscription.status} · до ${new Date(summary.subscription.endsAt).toLocaleDateString()}`
    : MESSAGES.noSubscription;
  const access = summary.access
    ? `${summary.access.accessType} · ${summary.access.provider} · ${summary.access.status}`
    : MESSAGES.noAccess;

  await ctx.reply(
    `Профиль: ${username}\nПодписка: ${subscription}\nVPN-доступ: ${access}\nРеферальный код: ${summary.user.referralCode}\n\nДля управления откройте мини-приложение.`,
    Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, miniAppUrl)])
  );
}
