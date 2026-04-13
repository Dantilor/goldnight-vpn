declare global {
  interface Window {
    Telegram?: {
      WebApp?: {
        initData: string;
        initDataUnsafe?: unknown;
        ready: () => void;
        expand: () => void;
        disableVerticalSwipes?: () => void;
        requestFullscreen?: () => Promise<void> | void;
        setHeaderColor?: (color: string) => void;
        setBackgroundColor?: (color: string) => void;
        setBottomBarColor?: (color: string) => void;
        openLink?: (url: string, options?: { try_instant_view?: boolean }) => void;
      };
    };
  }
}

export function hasTelegramWebAppInitData(): boolean {
  return Boolean(window.Telegram?.WebApp?.initData);
}

export function getTelegramInitData(): string {
  const webApp = window.Telegram?.WebApp;
  if (webApp?.initData) {
    return webApp.initData;
  }
  throw new Error('TELEGRAM_CONTEXT_REQUIRED: Telegram WebApp initData is unavailable');
}

/** Opens YooKassa (or any HTTPS checkout) in the Telegram client / browser. */
export function openCheckoutUrl(url: string) {
  const webApp = window.Telegram?.WebApp;
  if (webApp?.openLink) {
    webApp.openLink(url, { try_instant_view: false });
    return;
  }
  window.open(url, '_blank', 'noopener,noreferrer');
}

export function setupTelegramStartupUi() {
  const webApp = window.Telegram?.WebApp;
  if (!webApp) return;

  webApp.ready();
  webApp.expand();
  webApp.disableVerticalSwipes?.();

  // Keep Telegram chrome consistent with dark app shell.
  webApp.setHeaderColor?.('#131313');
  webApp.setBackgroundColor?.('#131313');
  webApp.setBottomBarColor?.('#131313');

  try {
    void webApp.requestFullscreen?.();
  } catch {
    // Fullscreen is optional and client-dependent.
  }
}
