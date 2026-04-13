import type { PropsWithChildren } from 'react';

export function Card({ children }: PropsWithChildren) {
  return (
    <section className="rounded-xl border border-[var(--gn-outline-soft)] bg-[var(--gn-surface-low)] p-5 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
      {children}
    </section>
  );
}
