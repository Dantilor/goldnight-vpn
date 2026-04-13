export function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="mb-5 space-y-2">
      <h2 className="font-headline text-2xl font-extrabold tracking-tight text-white">{title}</h2>
      {subtitle ? <p className="text-sm leading-relaxed text-[var(--gn-text-muted)]">{subtitle}</p> : null}
    </header>
  );
}
