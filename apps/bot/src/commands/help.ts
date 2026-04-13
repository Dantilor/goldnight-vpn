import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { MESSAGES } from '../constants/messages.js';
import { BUTTONS } from '../constants/buttons.js';

export async function handleHelp(ctx: Context, miniAppUrl: string) {
  await ctx.reply(
    `${MESSAGES.help}\n\nЧто доступно:\n• ${BUTTONS.mySubscription}\n• ${BUTTONS.setupVpn}\n• ${BUTTONS.referrals}\n\n${MESSAGES.support}\n\nОсновной сценарий: нажмите «${BUTTONS.openApp}».`,
    Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.openApp, miniAppUrl)])
  );
}
