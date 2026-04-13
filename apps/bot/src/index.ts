import 'dotenv/config';
import { parseBotEnv } from '@goldnight/config';
import { createBot } from './bot.js';

const env = parseBotEnv(process.env);
const bot = createBot(env);

bot.launch().then(() => {
  console.log('Telegram bot started');
});

process.once('SIGINT', () => bot.stop('SIGINT'));
process.once('SIGTERM', () => bot.stop('SIGTERM'));
