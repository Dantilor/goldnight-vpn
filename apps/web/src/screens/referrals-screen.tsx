/**
 * Hidden from product navigation for now — экран сохранён для будущего включения рефералок.
 */
import { useMeProfileQuery, useReferralsQuery } from '../lib/query-hooks';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/feedback';

export function ReferralsScreen() {
  const profile = useMeProfileQuery();
  const { data, isPending, isError, error } = useReferralsQuery();
  const referralCode = profile.data?.referralCode ?? 'gnvpn.io/ref/gold_user_772';
  const totalReferrals = data?.length ?? 0;
  const earnedRewards = data?.filter((item) => item.rewardGranted).length ?? 0;

  return (
    <main className="mx-auto max-w-md px-6 pb-32 pt-6">
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/15 bg-surface-container-low p-8">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-primary/5 blur-3xl"></div>
          <h2 className="mb-4 font-headline text-3xl font-extrabold leading-tight tracking-tighter text-white">
            ПРИГЛАШАЙТЕ В
            <br />
            <span className="text-primary">ЗОЛОТОЙ ДОСТУП</span>
          </h2>
          <p className="max-w-[80%] text-sm leading-relaxed text-on-surface-variant">
            Приглашайте знакомых в закрытый круг. За каждое успешное подключение вы получаете
            бонусы и приоритет в сети.
          </p>
        </div>
      </section>

      <section className="mb-10 grid grid-cols-2 gap-4">
        <div className="flex aspect-square flex-col justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-5">
          <div>
            <span className="material-symbols-outlined text-xl text-primary/60">group</span>
            <p className="mt-2 font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
              Всего рефералов
            </p>
          </div>
          <p className="font-headline text-4xl font-bold text-white">{totalReferrals}</p>
        </div>
        <div className="flex aspect-square flex-col justify-between rounded-xl border border-outline-variant/15 bg-surface-container-low p-5">
          <div>
            <span className="material-symbols-outlined text-xl text-primary/60">payments</span>
            <p className="mt-2 font-body text-[10px] uppercase tracking-widest text-on-surface-variant">
              Получено бонусов
            </p>
          </div>
          <p className="font-headline text-4xl font-bold text-white">{earnedRewards.toFixed(2)}</p>
        </div>
      </section>

      <section className="space-y-6">
        <div className="space-y-3">
          <label className="ml-1 font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
            Ваша уникальная ссылка
          </label>
          <div className="flex items-center gap-2 rounded-lg border border-outline-variant/15 bg-surface-container-highest p-4">
            <span className="flex-1 truncate text-xs text-white">{referralCode}</span>
            <button
              type="button"
              className="rounded-md p-2 text-primary transition-colors hover:bg-primary/10"
              onClick={() => navigator.clipboard.writeText(profile.data?.referralCode ?? '')}
              disabled={!profile.data?.referralCode}
            >
              <span className="material-symbols-outlined text-lg">content_copy</span>
            </button>
          </div>
        </div>
        <button
          type="button"
          className="gn-gold-gradient flex w-full items-center justify-center gap-2 rounded-lg py-4 font-headline font-bold text-[#3c2f00] shadow-[0_10px_20px_rgba(242,202,80,0.15)] transition-transform active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-xl">send</span>
          <span>Пригласить друзей</span>
        </button>
      </section>

      <section className="mt-16 flex flex-col items-center px-4 text-center">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-outline-variant/15 bg-surface-container-low">
          <span className="material-symbols-outlined text-3xl text-on-surface-variant/30">person_add</span>
        </div>
        <h3 className="mb-2 font-headline text-lg font-bold text-white">Пока никого нет</h3>
        <p className="max-w-xs text-sm text-on-surface-variant">
          Ваша реферальная сеть начинается здесь. Поделитесь ссылкой выше, чтобы начать получать
          бонусы и расширять приватную сеть.
        </p>
      </section>

      {profile.isPending ? (
        <div className="mt-4">
          <LoadingBlock text="Загрузка профиля..." />
        </div>
      ) : null}
      {profile.isError ? (
        <div className="mt-4">
          <ErrorBlock text={(profile.error as Error).message} />
        </div>
      ) : null}
      {isPending ? (
        <div className="mt-4">
          <LoadingBlock text="Загрузка рефералов..." />
        </div>
      ) : null}
      {isError ? (
        <div className="mt-4">
          <ErrorBlock text={(error as Error).message} />
        </div>
      ) : null}
      {!isPending && !isError && data?.length === 0 ? (
        <div className="mt-4">
          <EmptyBlock title="Рефералов пока нет" description="Поделитесь кодом, чтобы начать получать реферальные начисления." />
        </div>
      ) : null}
    </main>
  );
}
