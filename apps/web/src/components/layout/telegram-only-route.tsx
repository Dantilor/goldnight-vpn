import type { ReactNode } from 'react';
import { useMiniAppContext } from '../../lib/mini-app-context';
import { PreviewLockedScreen } from './preview-locked-screen';

type Props = {
  children: ReactNode;
  title: string;
  description: string;
};

export function TelegramOnlyRoute({ children, title, description }: Props) {
  const { isTelegramMiniApp } = useMiniAppContext();
  if (!isTelegramMiniApp) {
    return <PreviewLockedScreen title={title} description={description} />;
  }
  return <>{children}</>;
}
