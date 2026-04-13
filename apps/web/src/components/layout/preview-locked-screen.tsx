import { OpenInTelegramButton } from './open-in-telegram';

type Props = {
  title: string;
  description: string;
};

export function PreviewLockedScreen({ title, description }: Props) {
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-outline-variant/25 bg-surface-container-low p-4">
        <span className="material-symbols-outlined mb-2 block text-3xl text-primary/80">lock</span>
        <h1 className="font-headline text-xl font-bold leading-tight text-white">{title}</h1>
        <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">{description}</p>
      </div>
      <OpenInTelegramButton />
      <p className="text-center text-[11px] text-on-surface-variant/80">
        Предпросмотр: главная и тарифы доступны без входа.
      </p>
    </div>
  );
}
