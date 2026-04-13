import type { PropsWithChildren } from 'react';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="gn-safe-top mx-auto min-h-screen w-full max-w-md bg-[var(--gn-surface)]">
      <main className="space-y-4 px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom,0px))] pt-3">{children}</main>
      <BottomNav />
    </div>
  );
}
