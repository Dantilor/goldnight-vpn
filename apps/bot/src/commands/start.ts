import { createReadStream } from 'node:fs';
import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.js';
import { MESSAGES } from '../constants/messages.js';
import { appUrl } from '../lib/mini-app-url.js';
import { resolveWelcomeImagePath } from '../lib/welcome-asset.js';
import type { WelcomeSentStore } from '../services/welcome-sent-store.js';

async function dismissReplyKeyboard(ctx: Context): Promise<void> {
  const chatId = ctx.chat?.id;
  if (!chatId) {
    return;
  }
  try {
    const m = await ctx.telegram.sendMessage(chatId, '\u2060', {
      reply_markup: { remove_keyboard: true },
      disable_notification: true
    });
    await ctx.telegram.deleteMessage(chatId, m.message_id);
  } catch {
    // ignore
  }
}

async function tryDeleteMessage(ctx: Context, chatId: number, messageId: number | undefined): Promise<void> {
  if (messageId === undefined) {
    return;
  }
  try {
    await ctx.telegram.deleteMessage(chatId, messageId);
  } catch {
    // private chat / permissions / age limits
  }
}

export async function handleStart(input: {
  ctx: Context;
  welcomeSentStore: WelcomeSentStore;
  miniAppUrl: string;
}) {
  const telegramUserId = String(input.ctx.from?.id ?? '');
  const chatId = input.ctx.chat?.id;
  const entryUrl = appUrl(input.miniAppUrl, '/');
  const accessKeyboard = Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.getAccess, entryUrl)]);

  const alreadyWelcomed = telegramUserId ? await input.welcomeSentStore.isWelcomed(telegramUserId) : false;

  if (chatId !== undefined) {
    const prevId = telegramUserId ? await input.welcomeSentStore.getLastWelcomeMessageId(telegramUserId) : undefined;
    await tryDeleteMessage(input.ctx, chatId, prevId);
    await tryDeleteMessage(input.ctx, chatId, input.ctx.message?.message_id);
  }

  await dismissReplyKeyboard(input.ctx);

  let sentMessageId: number | undefined;

  if (alreadyWelcomed) {
    const m = await input.ctx.reply(MESSAGES.welcomeShort, accessKeyboard);
    sentMessageId = m.message_id;
  } else {
    const imagePath = resolveWelcomeImagePath();
    if (imagePath) {
      const m = await input.ctx.replyWithPhoto({ source: createReadStream(imagePath) }, {
        caption: MESSAGES.welcomeFullCaption,
        ...accessKeyboard
      });
      sentMessageId = m.message_id;
    } else {
      console.warn(
        'Welcome image not found: place apps/bot/assets/welcome.png or set WELCOME_IMAGE_PATH to an existing file.'
      );
      const m = await input.ctx.reply(MESSAGES.welcomeFullCaption, accessKeyboard);
      sentMessageId = m.message_id;
    }
  }

  if (telegramUserId && sentMessageId !== undefined) {
    await input.welcomeSentStore.setWelcomeMessage(
      telegramUserId,
      sentMessageId,
      !alreadyWelcomed
    );
  }
}
