export function LoadingBlock({ text }: { text: string }) {
  return <p className="text-sm text-on-surface-variant">{text}</p>;
}

export function ErrorBlock({ text }: { text: string }) {
  return <p className="text-sm text-rose-200">{text}</p>;
}

export function EmptyBlock({ title, description }: { title: string; description: string }) {
  return (
    <div className="space-y-1 rounded-xl border border-outline-variant/20 bg-surface-container-highest/40 p-4">
      <p className="font-headline text-sm font-bold text-slate-100">{title}</p>
      <p className="text-sm text-on-surface-variant">{description}</p>
    </div>
  );
}
