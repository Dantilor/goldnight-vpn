import { createReadStream } from 'node:fs';
import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.js';
import { MESSAGES } from '../constants/messages.js';
import { appUrl } from '../lib/mini-app-url.js';
import { resolveWelcomeImagePath } from '../lib/welcome-asset.js';
import type { WelcomeSentStore } from '../services/welcome-sent-store.js';

function accessKeyboards(entryUrl: string) {
  const webApp = Markup.inlineKeyboard([Markup.button.webApp(BUTTONS.getAccess, entryUrl)]);
  const urlOnly = Markup.inlineKeyboard([Markup.button.url(BUTTONS.getAccess, entryUrl)]);
  return { webApp, urlOnly };
}

async function replyWelcomeText(
  ctx: Context,
  text: string,
  entryUrl: string
): Promise<{ message_id: number }> {
  const { webApp, urlOnly } = accessKeyboards(entryUrl);
  try {
    return await ctx.reply(text, webApp);
  } catch (err) {
    console.error('[start] reply with web_app button failed, falling back to url button', err);
    return await ctx.reply(text, urlOnly);
  }
}

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

  const alreadyWelcomed = telegramUserId ? await input.welcomeSentStore.isWelcomed(telegramUserId) : false;

  if (chatId !== undefined) {
    const prevId = telegramUserId ? await input.welcomeSentStore.getLastWelcomeMessageId(telegramUserId) : undefined;
    await tryDeleteMessage(input.ctx, chatId, prevId);
    await tryDeleteMessage(input.ctx, chatId, input.ctx.message?.message_id);
  }

  await dismissReplyKeyboard(input.ctx);

  let sentMessageId: number | undefined;

  try {
    if (!alreadyWelcomed) {
      const imagePath = resolveWelcomeImagePath();
      if (imagePath) {
        try {
          await input.ctx.replyWithPhoto(
            { source: createReadStream(imagePath) },
            { caption: MESSAGES.welcomePhotoCaption }
          );
        } catch (err) {
          console.error('[start] welcome photo failed (continuing with text only)', err);
        }
      } else {
        console.warn(
          'Welcome image not found: place apps/bot/assets/welcome.png or set WELCOME_IMAGE_PATH to an existing file.'
        );
      }
    }

    const m = await replyWelcomeText(input.ctx, MESSAGES.welcomeFullCaption, entryUrl);
    sentMessageId = m.message_id;
  } catch (err) {
    console.error('[start] failed to send welcome', err);
    try {
      const m = await input.ctx.reply(
        'Не удалось отправить приветствие целиком. Напишите /start ещё раз или откройте приложение по ссылке из меню бота.',
        accessKeyboards(entryUrl).urlOnly
      );
      sentMessageId = m.message_id;
    } catch (fallbackErr) {
      console.error('[start] fallback reply also failed', fallbackErr);
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
