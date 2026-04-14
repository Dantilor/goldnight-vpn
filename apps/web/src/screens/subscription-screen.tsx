import { useCurrentSubscriptionQuery } from '../lib/query-hooks';
import { ErrorBlock, LoadingBlock } from '../components/ui/feedback';
import { useNavigate } from 'react-router-dom';

export function SubscriptionScreen() {
  const navigate = useNavigate();
  const { data, isPending, isError, error } = useCurrentSubscriptionQuery();
  const isActive = data?.status === 'active';
  const expiresLabel = data?.endsAt ? new Date(data.endsAt).toLocaleDateString() : 'N/A';
  const planName = data?.plan.name ?? 'Нет активного плана';
  const subtitle = isActive
    ? 'Ваш доступ к сети Golden Night активен и защищен.'
    : 'Ваш доступ к сети Golden Night сейчас приостановлен. Продлите подписку для восстановления защиты.';

  return (
    <div className="gn-page-stack relative mx-auto max-w-lg">
      {isPending ? (
        <div className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          <LoadingBlock text="Загрузка подписки..." />
        </div>
      ) : null}

      {isError ? (
        <div className="mb-4 rounded-xl border border-outline-variant/20 bg-surface-container-low p-4">
          <ErrorBlock text={(error as Error).message} />
        </div>
      ) : null}

      <section className="mb-8">
        <div className="mb-2 flex items-center justify-between">
          <span className="font-body text-xs uppercase tracking-[0.2em] text-outline-variant">
            Статус аккаунта
          </span>
          <div
            className={`flex items-center gap-1.5 rounded-full border px-3 py-1 ${
              isActive ? 'border-primary/20 bg-primary/10' : 'border-error/20 bg-error-container/20'
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                isActive
                  ? 'bg-primary shadow-[0_0_8px_rgba(242,202,80,0.6)]'
                  : 'bg-error shadow-[0_0_8px_rgba(255,180,171,0.6)]'
              }`}
            ></span>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-primary' : 'text-error'}`}>
              {isActive ? 'Активна' : 'Неактивна'}
            </span>
          </div>
        </div>
        <h2 className="mb-4 font-headline text-4xl font-extrabold tracking-tight text-white">Подписка</h2>
        <p className="max-w-[80%] text-sm leading-relaxed text-on-surface-variant">{subtitle}</p>
      </section>

      <div className="mb-8 grid grid-cols-2 gap-4">
        <div className="relative col-span-2 overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
          <div className="relative z-10">
            <span className="mb-2 block text-[10px] font-bold uppercase tracking-widest text-primary/60">
              Текущий план
            </span>
            <h3 className="mb-1 font-headline text-2xl font-bold text-white">{planName}</h3>
            <p className="text-sm text-on-surface-variant">
              {isActive ? 'Премиальная защита включена' : 'Профессиональный уровень шифрования'}
            </p>
          </div>
          <div className="pointer-events-none absolute -bottom-4 -right-4 opacity-5">
            <span className="material-symbols-outlined text-9xl">workspace_premium</span>
          </div>
        </div>

        <div className="aspect-square rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
          <span className="material-symbols-outlined text-2xl text-outline-variant">event_busy</span>
          <div className="mt-8">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-outline-variant">
              Окончание
            </span>
            <span className="font-headline text-lg font-bold text-white">{expiresLabel}</span>
          </div>
        </div>

        <div className="aspect-square rounded-xl border border-outline-variant/10 bg-surface-container-low p-5">
          <span className="material-symbols-outlined text-2xl text-outline-variant">receipt_long</span>
          <div className="mt-8">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-outline-variant">
              Цикл
            </span>
            <span className="font-headline text-lg font-bold text-white">Ручной</span>
          </div>
        </div>
      </div>

      <div className="mb-10 space-y-4">
        <h4 className="px-1 font-body text-xs uppercase tracking-widest text-outline-variant">Возможности плана</h4>
        <div className="space-y-3">
          <div className="flex items-center gap-4 rounded-xl bg-[#0e0e0e]/50 p-4">
            <span className="material-symbols-outlined text-primary/80">bolt</span>
            <p className="text-sm font-medium text-white">Узлы с минимальной задержкой</p>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-[#0e0e0e]/50 p-4">
            <span className="material-symbols-outlined text-primary/80">public</span>
            <p className="text-sm font-medium text-white">95+ глобальных точек доступа</p>
          </div>
          <div className="flex items-center gap-4 rounded-xl bg-[#0e0e0e]/50 p-4">
            <span className="material-symbols-outlined text-primary/80">devices</span>
            <p className="text-sm font-medium text-white">До 5 устройств одновременно</p>
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <button
          type="button"
          className="gn-gold-gradient w-full rounded-lg py-4 font-headline font-bold tracking-tight text-[#3c2f00] shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-transform active:scale-95"
          disabled
        >
          Продлить подписку
        </button>
        <button
          type="button"
          className="w-full rounded-lg border border-outline-variant/15 bg-surface-container-highest py-4 font-headline font-bold tracking-tight text-white transition-all hover:bg-surface-bright"
          onClick={() => navigate('/plans')}
        >
          Смотреть все планы
        </button>
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          className="text-[10px] font-bold uppercase tracking-widest text-outline-variant transition-colors hover:text-primary"
          onClick={() => navigate('/profile')}
        >
          Нужна помощь? Напишите в поддержку
        </button>
      </div>

      <div className="pointer-events-none fixed left-0 top-0 -z-10 h-screen w-full overflow-hidden">
        <div className="absolute right-[-10%] top-[-10%] h-[50%] w-[50%] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] h-[40%] w-[40%] rounded-full bg-primary/5 blur-[100px]"></div>
      </div>
    </div>
  );
}
