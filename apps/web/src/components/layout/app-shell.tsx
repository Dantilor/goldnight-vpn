import type { PropsWithChildren } from 'react';
import { BottomNav } from './bottom-nav';

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="mx-auto min-h-screen w-full max-w-md bg-[var(--gn-surface)]">
      <main className="gn-app-main-padding-top gn-page-main px-4">
        {children}
      </main>
      <BottomNav />
    </div>
  );
}
