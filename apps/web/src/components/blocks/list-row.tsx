import type { PropsWithChildren, ReactNode } from 'react';

export function ListRow({
  title,
  subtitle,
  right
}: PropsWithChildren<{ title: string; subtitle?: string; right?: ReactNode }>) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-outline-variant/20 bg-surface-container-highest/30 p-3">
      <div>
        <p className="text-sm font-semibold text-slate-100">{title}</p>
        {subtitle ? <p className="text-xs text-on-surface-variant">{subtitle}</p> : null}
      </div>
      {right}
    </div>
  );
}
