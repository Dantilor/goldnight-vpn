import { useState } from 'react';
import { useMeProfileQuery, useSupportQuery, useCurrentSubscriptionQuery } from '../lib/query-hooks';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/feedback';
import { useNavigate } from 'react-router-dom';

const SUPPORT_TELEGRAM = 'https://t.me/GameNightHelp';

const COPY = {
  account: {
    body: (
      <div className="space-y-5">
        <div>
          <p className="text-sm font-semibold text-white">Вход</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
            Идентификация через Telegram Mini App. Отдельный пароль в сервисе не нужен.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Доступ</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
            Статус подписки и VPN — на главной и в разделе «Подписка».
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Тариф</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
            Срок и план смотрите в «Подписка». Оплата и продление — по мере появления сценария в продукте.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Поддержка</p>
          <p className="mt-2 text-[13px] leading-relaxed text-on-surface-variant">
            Вопросы по доступу и настройке —{' '}
            <a href={SUPPORT_TELEGRAM} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-primary/35 underline-offset-2">
              @GameNightHelp
            </a>
            .
          </p>
        </div>
      </div>
    )
  },
  faq: {
    body: (
      <div className="space-y-5 text-[13px] leading-relaxed text-on-surface-variant">
        <div>
          <p className="text-sm font-semibold text-white">Как подключить VPN?</p>
          <p className="mt-2">
            Раздел «VPN» → платформа и клиент → шаги на экране: клиент, ключи, импорт, включение.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Не подключается</p>
          <p className="mt-2">
            Проверьте подписку и выданный доступ. Перезапустите клиент, смените сеть. Не помогло — напишите в Telegram.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Где подписка?</p>
          <p className="mt-2">Блок на главной и раздел «Подписка».</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Продление</p>
          <p className="mt-2">Когда оплата будет в продукте — в «Подписка». Пока детали — у поддержки.</p>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Контакт</p>
          <p className="mt-2">
            <a href={SUPPORT_TELEGRAM} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-primary/35 underline-offset-2">
              @GameNightHelp
            </a>
          </p>
        </div>
      </div>
    )
  },
  terms: {
    body: (
      <div className="space-y-4 text-[13px] leading-relaxed text-on-surface-variant">
        <p className="text-sm font-semibold text-white">Назначение</p>
        <p>
          Сервис предназначен для законного использования по правилам вашей юрисдикции. Запрещены действия в ущерб третьим
          лицам, распространение вредоносного ПО и нарушение правил сервиса.
        </p>
        <p className="text-sm font-semibold text-white pt-1">Ограничения</p>
        <p>Мы вправе ограничить доступ при нарушении условий. Тарифы и функции — в приложении и у поддержки.</p>
      </div>
    )
  },
  privacy: {
    body: (
      <div className="space-y-4 text-[13px] leading-relaxed text-on-surface-variant">
        <p className="text-sm font-semibold text-white">Вход</p>
        <p>Авторизация через Telegram. Для подписки и VPN обрабатываются минимально необходимые данные.</p>
        <p className="text-sm font-semibold text-white pt-1">Что используем</p>
        <p>
          Идентификатор, статус услуги, обращения в поддержку. Персональные данные не продаём. Технические логи — для
          стабильности сервиса.
        </p>
        <p className="pt-1">
          Уточнения —{' '}
          <a href={SUPPORT_TELEGRAM} target="_blank" rel="noreferrer" className="font-medium text-primary underline decoration-primary/35 underline-offset-2">
            @GameNightHelp
          </a>
          .
        </p>
      </div>
    )
  }
} as const;

type DocKey = keyof typeof COPY;

export function ProfileScreen() {
  const navigate = useNavigate();
  const profile = useMeProfileQuery();
  const support = useSupportQuery();
  const subscription = useCurrentSubscriptionQuery();
  const [openDoc, setOpenDoc] = useState<DocKey | null>(null);

  const profileName = profile.data?.firstName ?? profile.data?.username ?? 'Пользователь Golden Night';
  const profileHandle = profile.data?.username ? `@${profile.data.username}` : '@goldnight_user';

  const hasActiveSub = subscription.data?.status === 'active';
  const planLabel = hasActiveSub && subscription.data?.plan.name
    ? subscription.data.plan.name
    : 'Нет активной подписки';
  const planStatus = hasActiveSub ? 'Активен' : 'Неактивен';
  const expiresOn =
    hasActiveSub && subscription.data?.endsAt
      ? new Date(subscription.data.endsAt).toLocaleDateString('ru-RU')
      : '—';

  const toggleDoc = (key: DocKey) => {
    setOpenDoc((prev) => (prev === key ? null : key));
  };

  return (
    <div className="space-y-8 pb-4">
      <section className="relative">
        <div className="flex items-center gap-5 p-2">
          <div className="relative">
            <div className="h-[4.5rem] w-[4.5rem] overflow-hidden rounded-xl shadow-[0_0_20px_rgba(242,202,80,0.1)]">
              <div className="flex h-full w-full items-center justify-center bg-surface-container-highest text-sm text-on-surface-variant">
                GN
              </div>
            </div>
            <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border-2 border-surface bg-primary">
              <span
                className="material-symbols-outlined text-[12px] font-bold text-[#3c2f00]"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                verified
              </span>
            </div>
          </div>
          <div className="flex flex-col">
            <h2 className="font-headline text-2xl font-extrabold tracking-tight text-white">{profileName}</h2>
            <p className="font-body text-sm tracking-wide text-on-surface-variant">{profileHandle}</p>
            <div className="mt-2 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-2.5 py-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                {hasActiveSub ? 'Премиум участник' : 'Аккаунт'}
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 font-headline text-lg font-bold tracking-tight text-white">Поддержка</h3>
        <p className="px-1 text-sm text-on-surface-variant">
          Основной канал — Telegram. Напишите нам, если нужна помощь с подпиской или подключением.
        </p>
        <a
          href={SUPPORT_TELEGRAM}
          target="_blank"
          rel="noreferrer"
          className="flex flex-col rounded-xl border border-outline-variant/15 bg-surface-container-low p-5 transition-colors hover:bg-surface-container-high"
        >
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
            <span className="material-symbols-outlined text-primary">send</span>
          </div>
          <span className="font-headline text-sm font-bold text-white">Поддержка в Telegram</span>
          <span className="mt-1 font-body text-[11px] text-on-surface-variant">@GameNightHelp — ответим в рабочее время</span>
          <span className="mt-3 text-xs font-medium text-primary">Открыть чат →</span>
        </a>
      </section>

      <section className="space-y-3">
        <h3 className="px-1 font-headline text-lg font-bold tracking-tight text-white">Аккаунт и документы</h3>
        <div className="overflow-hidden rounded-2xl border border-outline-variant/10 bg-surface-container-low">
          {(
            [
              { key: 'account' as const, icon: 'manage_accounts', label: 'Настройки аккаунта' },
              { key: 'faq' as const, icon: 'quiz', label: 'Частые вопросы' },
              { key: 'terms' as const, icon: 'gavel', label: 'Условия использования' },
              { key: 'privacy' as const, icon: 'verified_user', label: 'Политика конфиденциальности' }
            ] as const
          ).map((item, index) => (
            <div key={item.key} className={index < 3 ? 'border-b border-outline-variant/5' : ''}>
              <button
                type="button"
                onClick={() => toggleDoc(item.key)}
                className="flex w-full items-center justify-between p-5 text-left transition-colors hover:bg-surface-container-high"
              >
                <div className="flex items-center gap-4">
                  <span className="material-symbols-outlined text-on-surface-variant/70">{item.icon}</span>
                  <span className="font-body text-sm font-medium text-white">{item.label}</span>
                </div>
                <span className="material-symbols-outlined text-lg text-on-surface-variant/40">
                  {openDoc === item.key ? 'expand_less' : 'expand_more'}
                </span>
              </button>
              {openDoc === item.key ? (
                <div className="border-t border-outline-variant/5 bg-surface-container-highest/20 px-5 pb-6 pt-6">
                  {COPY[item.key].body}
                </div>
              ) : null}
            </div>
          ))}
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl p-5 text-[#241a00] shadow-[0_15px_35px_rgba(242,202,80,0.2)] gn-gold-gradient">
        <div className="absolute right-[-10%] top-[-20%] opacity-10">
          <span className="material-symbols-outlined text-[180px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            shield
          </span>
        </div>
        <div className="relative z-10 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] opacity-80">Текущий план</p>
              <h4 className="font-headline text-xl font-black leading-tight">{planLabel}</h4>
            </div>
            <span className="shrink-0 rounded-full border border-white/30 bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-widest">
              {planStatus}
            </span>
          </div>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase opacity-70">Действует до</p>
              <p className="text-sm font-bold">{expiresOn}</p>
            </div>
            <button
              type="button"
              onClick={() => navigate(hasActiveSub ? '/subscription' : '/plans')}
              className="rounded-lg bg-[#241a00] px-4 py-2 text-xs font-black uppercase tracking-wider text-primary shadow-xl transition-transform active:scale-95"
            >
              {hasActiveSub ? 'Управлять' : 'Выбрать план'}
            </button>
          </div>
        </div>
      </section>

      {profile.isPending ? <LoadingBlock text="Загрузка профиля..." /> : null}
      {profile.isError ? <ErrorBlock text={(profile.error as Error).message} /> : null}
      {!profile.isPending && !profile.isError && !profile.data ? (
        <EmptyBlock title="Новый аккаунт" description="Данные профиля появятся после синхронизации с Telegram." />
      ) : null}
      {support.isPending ? <LoadingBlock text="Загрузка обращений..." /> : null}
      {support.isError ? <ErrorBlock text={(support.error as Error).message} /> : null}
      {!support.isPending && !support.isError && support.data?.length === 0 ? (
        <EmptyBlock title="Обращений пока нет" description="История обращений появится здесь." />
      ) : null}
    </div>
  );
}
