import { env } from '../../lib/env';

function telegramBotDeepLink(): string {
  const u = env.VITE_TELEGRAM_BOT_USERNAME.trim().replace(/^@/, '');
  return `https://t.me/${u}`;
}

export function OpenInTelegramButton({ className = '' }: { className?: string }) {
  return (
    <a
      href={telegramBotDeepLink()}
      target="_blank"
      rel="noreferrer"
      className={`gn-gold-gradient inline-flex w-full items-center justify-center gap-2 rounded-lg py-3.5 font-headline text-sm font-bold text-[#3c2f00] shadow-[0_10px_20px_rgba(242,202,80,0.15)] transition-opacity active:opacity-90 ${className}`}
    >
      <span className="material-symbols-outlined text-base">send</span>
      Открыть в Telegram
    </a>
  );
}
