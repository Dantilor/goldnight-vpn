import { createReadStream } from 'node:fs';
import type { Context } from 'telegraf';
import { Markup } from 'telegraf';
import { BUTTONS } from '../constants/buttons.js';
import { MESSAGES } from '../constants/messages.js';
import { appUrl } from '../lib/mini-app-url.js';
import { resolveWelcomeImagePath } from '../lib/welcome-asset.js';
import type { WelcomeSentStore } from '../services/welcome-sent-store.js';

const SIMPLE_START_REPLY = process.env.BOT_DEBUG_SIMPLE_START_REPLY === '1';

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
    console.info('[start] sending welcome with web_app keyboard');
    return await ctx.reply(text, { ...webApp, parse_mode: 'HTML' });
  } catch (err) {
    console.error('[start] reply with web_app button failed, falling back to url button', err);
    return await ctx.reply(text, { ...urlOnly, parse_mode: 'HTML' });
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
  console.info('[start] received', {
    telegramUserId,
    chatId,
    messageId: input.ctx.message?.message_id,
    simpleMode: SIMPLE_START_REPLY
  });

  const alreadyWelcomed = telegramUserId ? await input.welcomeSentStore.isWelcomed(telegramUserId) : false;

  if (chatId !== undefined) {
    const prevId = telegramUserId ? await input.welcomeSentStore.getLastWelcomeMessageId(telegramUserId) : undefined;
    await tryDeleteMessage(input.ctx, chatId, prevId);
    await tryDeleteMessage(input.ctx, chatId, input.ctx.message?.message_id);
  }

  await dismissReplyKeyboard(input.ctx);

  let sentMessageId: number | undefined;

  try {
    if (SIMPLE_START_REPLY) {
      console.info('[start] SIMPLE_START_REPLY enabled: sending plain test reply');
      const simple = await input.ctx.reply('GoldNight VPN start ok');
      sentMessageId = simple.message_id;
      console.info('[start] simple reply sent', { messageId: sentMessageId });
    } else {
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

      console.info('[start] sending welcome text', { alreadyWelcomed, entryUrl });
      const m = await replyWelcomeText(input.ctx, MESSAGES.welcomeFullCaption, entryUrl);
      sentMessageId = m.message_id;
      console.info('[start] welcome sent', { messageId: sentMessageId });
    }
  } catch (err) {
    console.error('[start] failed to send welcome', err);
    try {
      const m = await input.ctx.reply(
        'Не удалось отправить приветствие целиком. Напишите /start ещё раз или откройте приложение по кнопке ниже.',
        accessKeyboards(entryUrl).urlOnly
      );
      sentMessageId = m.message_id;
      console.info('[start] fallback text sent', { messageId: sentMessageId });
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

