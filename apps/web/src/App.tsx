import { lazy, Suspense, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { AppShell } from './components/layout/app-shell';
import { AppStartupLoader } from './components/layout/app-startup-loader';
import { HomeScreen } from './screens/home-screen';
import { PlansScreen } from './screens/plans-screen';
import { useMiniAppContext } from './lib/mini-app-context';
import { runTelegramMiniAppStartup } from './lib/mini-app-startup';
import { Card } from './components/ui/card';
import { ErrorBlock, LoadingBlock } from './components/ui/feedback';
import { TelegramOnlyRoute } from './components/layout/telegram-only-route';
import { setupTelegramStartupUi } from './lib/telegram';

const SubscriptionScreen = lazy(() =>
  import('./screens/subscription-screen').then((m) => ({ default: m.SubscriptionScreen }))
);
const ConnectScreen = lazy(() =>
  import('./screens/connect-screen').then((m) => ({ default: m.ConnectScreen }))
);
const ProfileScreen = lazy(() =>
  import('./screens/profile-screen').then((m) => ({ default: m.ProfileScreen }))
);

function AppRoutes() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const startupRouteHandledRef = useRef(false);

  /** Только первый запуск: нормализуем старт в /home, не ломая дальнейшую навигацию по вкладкам. */
  useLayoutEffect(() => {
    if (startupRouteHandledRef.current) return;
    startupRouteHandledRef.current = true;
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/home', { replace: true });
    }
    // intentionally run once on first mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { isTelegramMiniApp } = useMiniAppContext();
  type TelegramBootstrapPhase = 'loading' | 'ready' | 'error';
  const [tgBootstrapPhase, setTgBootstrapPhase] = useState<TelegramBootstrapPhase>(() =>
    isTelegramMiniApp ? 'loading' : 'ready'
  );
  const [tgBootstrapError, setTgBootstrapError] = useState<Error | null>(null);

  useEffect(() => {
    if (!isTelegramMiniApp) return;
    setupTelegramStartupUi();
  }, [isTelegramMiniApp]);

  useEffect(() => {
    if (!isTelegramMiniApp) {
      setTgBootstrapPhase('ready');
      setTgBootstrapError(null);
      return;
    }

    let cancelled = false;
    setTgBootstrapPhase('loading');
    setTgBootstrapError(null);

    runTelegramMiniAppStartup(queryClient)
      .then(() => {
        if (cancelled) return;
        setTgBootstrapError(null);
        setTgBootstrapPhase('ready');
      })
      .catch((err) => {
        if (cancelled) return;
        setTgBootstrapError(err instanceof Error ? err : new Error(String(err)));
        setTgBootstrapPhase('error');
      });

    return () => {
      cancelled = true;
    };
  }, [isTelegramMiniApp, queryClient]);

  if (isTelegramMiniApp && tgBootstrapPhase === 'loading') {
    return (
      <AppShell>
        <AppStartupLoader />
      </AppShell>
    );
  }

  if (isTelegramMiniApp && tgBootstrapPhase === 'error' && tgBootstrapError) {
    const authErrorMessage = tgBootstrapError.message ?? 'Не удалось войти через Telegram.';
    return (
      <AppShell>
        <Card>
          <ErrorBlock
            text={
              authErrorMessage.includes('SESSION_EXPIRED')
                ? 'Сессия истекла. Повторите вход через Telegram Mini App.'
                : authErrorMessage.includes('Failed to fetch') ||
                    authErrorMessage.includes('NetworkError') ||
                    authErrorMessage.includes('ERR_NETWORK')
                  ? 'Сетевая ошибка. Проверьте подключение и доступность API.'
                  : authErrorMessage.includes('Telegram authentication failed') ||
                      authErrorMessage.includes('401')
                    ? 'Ошибка авторизации Telegram. Проверьте запуск Mini App из Telegram.'
                    : authErrorMessage.includes('Telegram authentication is not configured on server') ||
                        authErrorMessage.includes('503')
                      ? 'Авторизация Telegram временно недоступна на сервере.'
                      : authErrorMessage.includes('TELEGRAM_CONTEXT_REQUIRED')
                        ? 'Откройте приложение через Telegram Mini App.'
                        : 'Ошибка авторизации.'
            }
          />
          <p className="mt-1 text-xs text-on-surface-variant">
            {authErrorMessage.includes('SESSION_EXPIRED')
              ? 'Токен приложения больше не действителен. Нажмите «Повторить» для новой авторизации.'
              : authErrorMessage.includes('Failed to fetch') ||
                  authErrorMessage.includes('NetworkError') ||
                  authErrorMessage.includes('ERR_NETWORK')
                ? 'Не удалось связаться с сервером. Убедитесь, что API запущен и доступен.'
                : authErrorMessage.includes('Telegram authentication failed') ||
                    authErrorMessage.includes('401')
                  ? 'Сервер отклонил initData. Откройте Mini App через Telegram menu/web_app кнопку.'
                  : authErrorMessage.includes('Telegram authentication is not configured on server') ||
                      authErrorMessage.includes('503')
                    ? 'Добавьте TELEGRAM_BOT_TOKEN в env API и повторите попытку.'
                    : authErrorMessage.includes('TELEGRAM_CONTEXT_REQUIRED')
                      ? 'Полный доступ к разделам доступен только внутри Telegram.'
                      : authErrorMessage}
          </p>
          <button
            type="button"
            className="gn-gold-gradient mt-4 w-full rounded-xl py-3.5 font-headline text-sm font-bold text-[#3c2f00] transition active:scale-[0.99]"
            onClick={() => {
              setTgBootstrapPhase('loading');
              setTgBootstrapError(null);
              runTelegramMiniAppStartup(queryClient)
                .then(() => {
                  setTgBootstrapError(null);
                  setTgBootstrapPhase('ready');
                })
                .catch((err) => {
                  setTgBootstrapError(err instanceof Error ? err : new Error(String(err)));
                  setTgBootstrapPhase('error');
                });
            }}
          >
            Повторить
          </button>
        </Card>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<Navigate to="/home" replace />} />
        <Route path="/home" element={<HomeScreen />} />
        <Route path="/plans" element={<PlansScreen />} />
        <Route
          path="/subscription"
          element={
            <Suspense
              fallback={
                <Card>
                  <LoadingBlock text="Открываем раздел..." />
                </Card>
              }
            >
              <TelegramOnlyRoute
                title="Подписка"
                description="Персональный статус подписки и продление доступны после входа через Telegram Mini App."
              >
                <SubscriptionScreen />
              </TelegramOnlyRoute>
            </Suspense>
          }
        />
        <Route
          path="/connect"
          element={
            <Suspense
              fallback={
                <Card>
                  <LoadingBlock text="Открываем раздел..." />
                </Card>
              }
            >
              <TelegramOnlyRoute
                title="Подключение VPN"
                description="Персональные ключи и инструкции подключения доступны после авторизации в Telegram."
              >
                <ConnectScreen />
              </TelegramOnlyRoute>
            </Suspense>
          }
        />
        <Route
          path="/profile"
          element={
            <Suspense
              fallback={
                <Card>
                  <LoadingBlock text="Открываем раздел..." />
                </Card>
              }
            >
              <TelegramOnlyRoute
                title="Профиль"
                description="Персональный профиль и обращения в поддержку доступны после авторизации в Telegram."
              >
                <ProfileScreen />
              </TelegramOnlyRoute>
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </AppShell>
  );
}

export default function App() {
  return <AppRoutes />;
}
