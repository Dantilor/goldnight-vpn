import { createContext, useContext, useMemo, type ReactNode } from 'react';
import { hasTelegramWebAppInitData } from './telegram';

export type MiniAppContextValue = {
  /** true = открыто внутри Telegram WebApp с initData (полный доступ после auth) */
  isTelegramMiniApp: boolean;
};

const MiniAppContext = createContext<MiniAppContextValue>({ isTelegramMiniApp: false });

export function MiniAppProvider({ children }: { children: ReactNode }) {
  const value = useMemo<MiniAppContextValue>(
    () => ({ isTelegramMiniApp: hasTelegramWebAppInitData() }),
    []
  );
  return <MiniAppContext.Provider value={value}>{children}</MiniAppContext.Provider>;
}

export function useMiniAppContext(): MiniAppContextValue {
  return useContext(MiniAppContext);
}
