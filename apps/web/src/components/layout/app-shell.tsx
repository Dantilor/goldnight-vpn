import type { PropsWithChildren } from 'react';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[var(--gn-surface)]">
      <main className="gn-app-main-padding-top space-y-6 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))]">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
