import { StatusBadge } from '../components/ui/status-badge';
import { useCurrentSubscriptionQuery } from '../lib/query-hooks';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/feedback';
import { useNavigate } from 'react-router-dom';
import { useMiniAppContext } from '../lib/mini-app-context';
import { useAuthToken } from '../lib/use-auth-token';
import { OpenInTelegramButton } from '../components/layout/open-in-telegram';

function QuickLink({
  icon,
  label,
  onClick
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex min-h-[72px] flex-col items-center justify-center gap-1 rounded-xl border border-outline-variant/20 bg-surface-container-low px-2 py-2 text-center transition active:scale-[0.98]"
    >
      <span className="material-symbols-outlined text-xl text-primary">{icon}</span>
      <span className="max-w-full truncate text-[11px] font-semibold leading-tight text-white">{label}</span>
    </button>
  );
}

export function HomeScreen() {
  const navigate = useNavigate();
  const { isTelegramMiniApp } = useMiniAppContext();
  const token = useAuthToken();
  const { data, isPending, isError, error } = useCurrentSubscriptionQuery();
  const awaitingTelegramSession = isTelegramMiniApp && !token;
  const hasActive = data?.status === 'active';
  const status = data?.status ?? 'pending';
  const tone = status === 'active' ? 'active' : status === 'expired' ? 'expired' : 'pending';
  const statusLabel =
    status === 'active' ? 'Активна' : status === 'expired' ? 'Истекла' : 'Ожидание';

  const previewHero = (
    <section className="rounded-xl border border-primary/20 bg-surface-container-low/80 p-4">
      <p className="font-body text-[10px] font-semibold uppercase tracking-widest text-primary/80">
        Предпросмотр
      </p>
      <p className="mt-2 text-sm leading-relaxed text-on-surface-variant">
        GoldNight VPN — приватный доступ и стабильное соединение. Оформление и личный кабинет — в Telegram Mini
        App.
      </p>
      <div className="mt-4 space-y-2">
        <OpenInTelegramButton />
        <button
          type="button"
          className="w-full rounded-lg border border-outline-variant/30 py-3 text-sm font-semibold text-white transition hover:bg-surface-container-highest"
          onClick={() => navigate('/plans')}
        >
          Смотреть тарифы
        </button>
      </div>
    </section>
  );

  return (
    <div className="space-y-5">
      <section className="space-y-1 text-center">
        <p className="font-body text-[11px] font-semibold uppercase tracking-[0.22em] text-primary">
          GoldNight VPN
        </p>
        <h1 className="font-headline text-2xl font-extrabold leading-tight tracking-tight text-white">
          Главная
        </h1>
        <p className="mx-auto max-w-[28rem] text-sm text-on-surface-variant">
          {isTelegramMiniApp
            ? 'Статус, планы и подключение в одном месте.'
            : 'Ознакомьтесь с продуктом и тарифами. Полный доступ — в Telegram.'}
        </p>
      </section>

      {!isTelegramMiniApp ? previewHero : null}

      {/* Подписка: в Telegram — данные с API; вне Telegram — без персональных запросов */}
      <section className="rounded-xl border border-outline-variant/20 bg-surface-container-low p-4 shadow-[0_20px_40px_rgba(0,0,0,0.25)]">
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-0.5">
            <h2 className="font-body text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
              Подписка
            </h2>
            {!isTelegramMiniApp ? (
              <p className="text-sm text-on-surface-variant">
                Статус вашей подписки отображается после входа через Telegram Mini App.
              </p>
            ) : awaitingTelegramSession || (isPending && data === undefined) ? (
              <div className="space-y-2 pt-1" aria-hidden>
                <div className="h-5 w-3/4 max-w-[200px] animate-pulse rounded-md bg-surface-container-highest" />
                <div className="h-3 w-1/2 max-w-[140px] animate-pulse rounded-md bg-surface-container-highest/70" />
                <p className="sr-only">Загрузка статуса подписки</p>
              </div>
            ) : isError ? (
              <ErrorBlock text={(error as Error).message} />
            ) : (
              <>
                <p className="font-headline text-lg font-bold leading-snug text-white">
                  {data ? data.plan.name : 'Нет активной подписки'}
                </p>
                {data ? (
                  <p className="text-xs text-on-surface-variant">
                    До {new Date(data.endsAt).toLocaleDateString('ru-RU')}
                  </p>
                ) : (
                  <p className="text-xs text-on-surface-variant">Выберите тариф, чтобы включить доступ.</p>
                )}
              </>
            )}
          </div>
          <div className="shrink-0 rounded-lg bg-surface-container-highest p-2">
            <span className="material-symbols-outlined text-2xl text-outline-variant">
              {data && hasActive ? 'verified' : 'shield_lock'}
            </span>
          </div>
        </div>

        {isTelegramMiniApp && !awaitingTelegramSession && !isPending && !isError && data ? (
          <StatusBadge label={statusLabel} tone={tone} />
        ) : null}

        {isTelegramMiniApp && !awaitingTelegramSession && !isPending && !isError ? (
          <div className="mt-4 space-y-2">
            <button
              type="button"
              className="gn-gold-gradient flex w-full items-center justify-center gap-2 rounded-lg py-3.5 font-headline text-sm font-bold text-[#3c2f00] shadow-[0_10px_20px_rgba(242,202,80,0.15)] transition-transform active:scale-[0.98]"
              onClick={() => navigate(data && hasActive ? '/connect' : '/plans')}
            >
              {data && hasActive ? 'Подключить VPN' : 'Выбрать план'}
              <span className="material-symbols-outlined text-base">arrow_forward</span>
            </button>
            {!data ? (
              <EmptyBlock
                title="Подписка не оформлена"
                description="Откройте каталог планов и выберите подходящий тариф."
              />
            ) : null}
          </div>
        ) : null}

      </section>

      <section>
        <h2 className="mb-2 px-0.5 font-body text-[10px] font-semibold uppercase tracking-widest text-on-surface-variant">
          Быстро
        </h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <QuickLink icon="inventory_2" label="Планы" onClick={() => navigate('/plans')} />
          <QuickLink icon="link" label="Подключение" onClick={() => navigate('/connect')} />
          <QuickLink icon="card_membership" label="Подписка" onClick={() => navigate('/subscription')} />
          <QuickLink icon="person" label="Профиль" onClick={() => navigate('/profile')} />
        </div>
        <p className="mt-2 px-0.5 text-[11px] text-on-surface-variant">
          {isTelegramMiniApp ? 'Поддержка — в разделе «Профиль».' : 'Личные разделы откроются после входа в Telegram.'}
        </p>
      </section>
    </div>
  );
}
