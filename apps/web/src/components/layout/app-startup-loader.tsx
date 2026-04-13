/** Единый premium-экран загрузки до готовности критичных данных (Telegram Mini App). */
export function AppStartupLoader() {
  return (
    <div className="flex min-h-[calc(100dvh-8rem)] flex-col items-center justify-center px-4 py-8">
      <div className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-primary/22 bg-gradient-to-b from-[#1c1b18] via-surface-container-low to-[#101010] p-8 shadow-[0_24px_64px_rgba(0,0,0,0.5)]">
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_50%_0%,rgba(242,202,80,0.12),transparent_55%)]"
          aria-hidden
        />
        <div className="relative flex flex-col items-center">
          <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-primary/28 bg-primary/[0.1] shadow-[0_0_32px_rgba(242,202,80,0.12)]">
            <span
              className="material-symbols-outlined text-[2.75rem] text-primary motion-safe:animate-pulse"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              shield_lock
            </span>
          </div>
          <p className="mt-6 text-center font-headline text-xl font-bold tracking-tight text-white">GoldNight VPN</p>
          <p className="mt-2 text-center text-sm text-on-surface-variant">Загружаем ваш профиль и доступ…</p>
          <div className="mt-8 w-full space-y-2.5" aria-hidden>
            <div className="h-2.5 animate-pulse rounded-full bg-surface-container-highest/90" />
            <div className="h-2.5 w-[88%] animate-pulse rounded-full bg-surface-container-highest/60" />
            <div className="h-2.5 w-[64%] animate-pulse rounded-full bg-surface-container-highest/40" />
          </div>
        </div>
      </div>
    </div>
  );
}
