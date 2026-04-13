type StatusTone = 'active' | 'pending' | 'expired' | 'neutral';

const toneToClassName: Record<StatusTone, string> = {
  active: 'bg-primary/10 text-primary border-primary/30',
  pending: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/40',
  expired: 'bg-rose-950/40 text-rose-200 border-rose-800/60',
  neutral: 'bg-surface-container-highest text-on-surface-variant border-outline-variant/40'
};

export function StatusBadge({ label, tone = 'neutral' }: { label: string; tone?: StatusTone }) {
  return (
    <span
      className={`inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide ${toneToClassName[tone]}`}
    >
      {label}
    </span>
  );
}
