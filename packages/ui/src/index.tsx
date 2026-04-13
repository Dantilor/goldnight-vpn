import type { PropsWithChildren } from 'react';

export function Card({ children }: PropsWithChildren) {
  return <div className="rounded-2xl border border-slate-700 bg-slate-900 p-4">{children}</div>;
}

export function SectionTitle({ children }: PropsWithChildren) {
  return <h2 className="text-lg font-semibold text-white">{children}</h2>;
}

export function PrimaryButton({
  children,
  onClick
}: PropsWithChildren<{ onClick?: () => void }>) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-400"
    >
      {children}
    </button>
  );
}
