type TelegramInset = { top: number; bottom: number; left: number; right: number };

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
        /** Область под системными элементами (notch и т.д.) */
        safeAreaInset?: TelegramInset;
        /** Отступ контента ниже шапки Mini App (Закрыть / меню) — приоритет для верхнего padding */
        contentSafeAreaInset?: TelegramInset;
        onEvent?: (eventType: string, eventHandler: () => void) => void;
        offEvent?: (eventType: string, eventHandler: () => void) => void;
      };
    };
  }
}

const GN_TOP_BUFFER_PX = 20;
/** Если клиент не отдаёт insets (старый Telegram / десктоп) */
const GN_TELEGRAM_FALLBACK_TOP_PX = 72;
/** Минимальный старт контента ниже telegram header controls. */
const GN_MIN_TOP_START_PX = 72;

/**
 * Вертикальный отступ под шапку Telegram Mini App + safe area.
 * Пишет --gn-app-padding-top на :root; пересчитывать при смене viewport / safe area.
 */
export function applyMiniAppContentInsets(): void {
  const wa = window.Telegram?.WebApp;
  if (!wa) {
    document.documentElement.style.setProperty('--gn-app-padding-top', '0px');
    return;
  }

  const apply = () => {
    const contentTop = Number(wa.contentSafeAreaInset?.top) || 0;
    const safeTop = Number(wa.safeAreaInset?.top) || 0;
    let px: number;
    if (contentTop > 0) {
      px = contentTop + GN_TOP_BUFFER_PX;
    } else if (safeTop > 0) {
      px = safeTop + 40;
    } else {
      px = GN_TELEGRAM_FALLBACK_TOP_PX;
    }
    px = Math.max(px, GN_MIN_TOP_START_PX);
    document.documentElement.style.setProperty('--gn-app-padding-top', `${px}px`);
  };

  apply();

  const handler = () => apply();
  const events = ['safeAreaChanged', 'contentSafeAreaChanged', 'viewportChanged', 'safe_area_changed', 'viewport_changed'];
  for (const ev of events) {
    wa.onEvent?.(ev, handler);
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
  applyMiniAppContentInsets();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => applyMiniAppContentInsets());
  });

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
