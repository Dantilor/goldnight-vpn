import { useEffect, useMemo, useRef, useState } from 'react';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import {
  useCurrentSubscriptionQuery,
  useMeProfileQuery,
  usePlansQuery,
  useYookassaCheckoutMutation
} from '../lib/query-hooks';
import { EmptyBlock, ErrorBlock, LoadingBlock } from '../components/ui/feedback';
import { markPendingCheckoutRefresh } from '../lib/post-checkout-refresh';
import { openCheckoutUrl } from '../lib/telegram';
import type { Plan } from '../types/api';

const DURATION_TABS = [30, 90, 180, 365] as const;

const TIER_ORDER = ['basic', 'standard', 'premium'] as const;
type PlanTier = (typeof TIER_ORDER)[number];

const TIER_LABEL: Record<PlanTier, string> = {
  basic: 'Базовый',
  standard: 'Стандарт',
  premium: 'Премиум'
};

function formatSubscriptionEnd(endsAt: string) {
  return new Date(endsAt).toLocaleDateString('ru-RU', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

function tierFromPlanCode(code: string): PlanTier | null {
  if (code.startsWith('basic_')) return 'basic';
  if (code.startsWith('standard_')) return 'standard';
  if (code.startsWith('premium_')) return 'premium';
  return null;
}

function durationLabel(days: number) {
  return `${days} дн.`;
}

function plansForDuration(plans: Plan[], durationDays: number): Plan[] {
  const byTier = new Map<PlanTier, Plan>();
  for (const p of plans) {
    if (p.durationDays !== durationDays) continue;
    const tier = tierFromPlanCode(p.code);
    if (!tier) continue;
    byTier.set(tier, p);
  }
  return TIER_ORDER.map((t) => byTier.get(t)).filter((p): p is Plan => Boolean(p));
}

export function PlansScreen() {
  const { data, isPending, isError, error } = usePlansQuery();
  const { data: subscription, isPending: subscriptionPending } = useCurrentSubscriptionQuery();
  const { data: me, isPending: mePending } = useMeProfileQuery();
  const checkout = useYookassaCheckoutMutation();
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [pendingPlanId, setPendingPlanId] = useState<string | null>(null);
  const [emailGatePlanId, setEmailGatePlanId] = useState<string | null>(null);
  const [receiptEmailDraft, setReceiptEmailDraft] = useState('');
  const [emailGateError, setEmailGateError] = useState<string | null>(null);
  const [selectedDays, setSelectedDays] = useState<number>(30);
  const alignedDurationRef = useRef(false);

  function closeEmailGate() {
    setEmailGatePlanId(null);
    setReceiptEmailDraft('');
    setEmailGateError(null);
  }

  async function runCheckout(planId: string, receiptEmail?: string) {
    setCheckoutError(null);
    setPendingPlanId(planId);
    try {
      const { confirmationUrl } = await checkout.mutateAsync(
        receiptEmail !== undefined ? { planId, receiptEmail } : { planId }
      );
      markPendingCheckoutRefresh(planId);
      openCheckoutUrl(confirmationUrl);
      closeEmailGate();
    } catch (e) {
      setCheckoutError(e instanceof Error ? e.message : 'Не удалось открыть оплату.');
    } finally {
      setPendingPlanId(null);
    }
  }

  async function onConfirmReceiptEmail() {
    const raw = receiptEmailDraft.trim().toLowerCase();
    if (!raw) {
      setEmailGateError('Введите email');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(raw)) {
      setEmailGateError('Проверьте формат email');
      return;
    }
    if (!emailGatePlanId) return;
    setEmailGateError(null);
    await runCheckout(emailGatePlanId, raw);
  }

  const subscriptionReady = !subscriptionPending;
  const hasActiveSubscription = subscriptionReady && subscription?.status === 'active';

  useEffect(() => {
    if (alignedDurationRef.current) return;
    if (!subscriptionReady) return;
    if (hasActiveSubscription && subscription?.plan.durationDays) {
      setSelectedDays(subscription.plan.durationDays);
    }
    alignedDurationRef.current = true;
  }, [subscriptionReady, hasActiveSubscription, subscription?.plan.durationDays]);

  const plansForTab = useMemo(() => {
    if (!data?.length) return [];
    return plansForDuration(data, selectedDays);
  }, [data, selectedDays]);

  async function onSelectPlan(planId: string) {
    if (mePending) return;
    if (!me?.email?.trim()) {
      setEmailGatePlanId(planId);
      setReceiptEmailDraft('');
      setEmailGateError(null);
      return;
    }
    await runCheckout(planId);
  }

  return (
    <div className="gn-page-stack pt-2">
      <header className="space-y-2.5 text-left">
        <span className="block font-body text-[10px] font-semibold uppercase tracking-[0.22em] text-primary">
          Подписка
        </span>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-white sm:text-3xl">Тарифы</h1>
        <p className="max-w-md text-sm leading-relaxed text-on-surface-variant">
          Выберите срок и подходящий уровень доступа.
        </p>

        {checkoutError ? (
          <div className="pt-1">
            <ErrorBlock text={checkoutError} />
          </div>
        ) : null}

        {hasActiveSubscription && subscription ? (
          <div className="rounded-2xl border border-primary/25 bg-gradient-to-br from-primary/[0.08] via-surface-container-low to-[#121212] px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.35)]">
            <p className="text-sm text-on-surface-variant">
              Текущий план:{' '}
              <span className="font-headline font-bold text-white">{subscription.plan.name}</span>
            </p>
            <p className="mt-1 text-sm text-on-surface-variant">
              Активен до{' '}
              <span className="font-semibold text-primary/95">{formatSubscriptionEnd(subscription.endsAt)}</span>
            </p>
          </div>
        ) : null}
      </header>

      {isPending ? (
        <Card>
          <LoadingBlock text="Загрузка планов..." />
        </Card>
      ) : null}

      {isError ? (
        <Card>
          <ErrorBlock text={(error as Error).message} />
        </Card>
      ) : null}

      {!isPending && !isError && data?.length === 0 ? (
        <Card>
          <EmptyBlock
            title="Планы недоступны"
            description="Планы временно недоступны. Попробуйте позже."
          />
        </Card>
      ) : null}

      {!isPending && !isError && data?.length ? (
        <>
          <div
            className="flex gap-1 rounded-2xl border border-outline-variant/15 bg-surface-container-low/80 p-1 shadow-inner"
            role="tablist"
            aria-label="Срок подписки"
          >
            {DURATION_TABS.map((days) => {
              const active = selectedDays === days;
              return (
                <button
                  key={days}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setSelectedDays(days)}
                  className={`min-h-[44px] flex-1 rounded-xl px-1.5 text-center text-[11px] font-bold leading-tight transition-all sm:text-xs ${
                    active
                      ? 'gn-gold-gradient text-[#3c2f00] shadow-[0_6px_20px_rgba(242,202,80,0.22)]'
                      : 'text-on-surface-variant hover:bg-surface-container-highest/80 hover:text-white'
                  }`}
                >
                  {durationLabel(days)}
                </button>
              );
            })}
          </div>

          {plansForTab.length === 0 ? (
            <Card>
              <EmptyBlock
                title="Нет планов на выбранный срок"
                description="Попробуйте другой период или обновите страницу позже."
              />
            </Card>
          ) : (
            <div className="space-y-3">
              {plansForTab.map((plan) => {
                const tier = tierFromPlanCode(plan.code);
                const tierTitle = tier ? TIER_LABEL[tier] : plan.name;
                const isStandard = tier === 'standard';
                const isCurrent = Boolean(hasActiveSubscription && subscription && plan.id === subscription.plan.id);
                const subtitle = plan.subtitle?.trim() || 'Приватный высокоскоростной доступ';
                const endsLabel =
                  isCurrent && subscription?.endsAt ? formatSubscriptionEnd(subscription.endsAt) : null;
                const priceLabel = `${plan.priceRub.toLocaleString('ru-RU')} ₽`;
                const payingThis = pendingPlanId === plan.id;
                const checkoutBusy = Boolean(pendingPlanId) || mePending;

                return (
                  <div
                    key={plan.id}
                    className={`relative overflow-hidden rounded-2xl border bg-surface-container-low p-5 transition-all duration-300 ${
                      isCurrent
                        ? 'border-primary/55 shadow-[0_0_0_1px_rgba(242,202,80,0.25),0_20px_48px_rgba(242,202,80,0.12)]'
                        : isStandard && !isCurrent
                          ? 'border-primary/25 shadow-[0_16px_40px_rgba(0,0,0,0.45)]'
                          : 'border-outline-variant/15 hover:border-outline-variant/30'
                    }`}
                  >
                    {isCurrent ? (
                      <div className="gn-gold-gradient absolute right-0 top-0 rounded-bl-xl px-3 py-1">
                        <span className="text-[9px] font-bold uppercase tracking-tight text-[#3c2f00]">
                          Текущий план
                        </span>
                      </div>
                    ) : isStandard ? (
                      <div className="gn-gold-gradient absolute right-0 top-0 rounded-bl-xl px-3 py-1">
                        <span className="text-[9px] font-bold uppercase tracking-tight text-[#3c2f00]">
                          Самый популярный
                        </span>
                      </div>
                    ) : null}

                    <div className={`space-y-1 ${isCurrent || isStandard ? 'pr-24 pt-0.5' : ''}`}>
                      <h2
                        className={`font-headline text-lg font-bold ${
                          isCurrent || (isStandard && !isCurrent) ? 'text-primary' : 'text-white'
                        }`}
                      >
                        {tierTitle}
                      </h2>
                      <p className="text-sm text-on-surface-variant">{subtitle}</p>
                      <p className="text-xs text-on-surface-variant">
                        Устройств: <span className="font-semibold text-white">{plan.deviceLimit}</span>
                      </p>
                      {isCurrent && endsLabel ? (
                        <p className="text-xs font-medium text-primary/95">Активен до {endsLabel}</p>
                      ) : null}
                    </div>

                    <div className="mt-4 flex items-end justify-between gap-3 border-t border-outline-variant/10 pt-4">
                      <span className="font-headline text-2xl font-extrabold tracking-tight text-white">
                        {priceLabel}
                      </span>
                      <Button
                        type="button"
                        className="min-w-[140px] shrink-0 py-3 text-xs font-bold uppercase tracking-wider"
                        variant={isCurrent ? 'secondary' : isStandard && !isCurrent ? 'primary' : 'secondary'}
                        disabled={Boolean(isCurrent)}
                        aria-disabled={isCurrent}
                        onClick={() => {
                          if (isCurrent) return;
                          if (pendingPlanId === plan.id) return;
                          if (checkoutBusy) return;
                          void onSelectPlan(plan.id);
                        }}
                      >
                        {isCurrent ? 'Активен' : payingThis ? 'Открываем оплату...' : 'Выбрать план'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="space-y-4 border-t border-outline-variant/10 pt-8 text-center">
            <div className="flex items-center justify-center gap-8 opacity-35 grayscale">
              <span className="material-symbols-outlined text-2xl">lock</span>
              <span className="material-symbols-outlined text-2xl">verified_user</span>
              <span className="material-symbols-outlined text-2xl">speed</span>
            </div>
            <div className="space-y-1">
              <p className="font-body text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">
                Политика без логов
              </p>
              <p className="font-body text-[9px] text-white/30">
                Управляется приватной инфраструктурой. Без сторонних обработчиков данных.
              </p>
            </div>
          </div>
        </>
      ) : null}

      {emailGatePlanId ? (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="email-gate-title"
          onClick={(e) => {
            if (e.target === e.currentTarget && !pendingPlanId) closeEmailGate();
          }}
        >
          <div className="w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <Card>
              <div className="space-y-4">
                <h2 id="email-gate-title" className="font-headline text-lg font-bold text-white">
                  Email для чека
                </h2>
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  Для оплаты нужен email: на него уйдёт электронный чек (54‑ФЗ). Мы сохраним его в вашем профиле.
                </p>
                <label className="block text-xs font-medium uppercase tracking-wide text-on-surface-variant">
                  Email
                  <input
                    type="email"
                    name="receipt-email"
                    autoComplete="email"
                    inputMode="email"
                    value={receiptEmailDraft}
                    onChange={(ev) => setReceiptEmailDraft(ev.target.value)}
                    className="mt-1.5 w-full rounded-xl border border-outline-variant/25 bg-surface-container-highest px-3 py-2.5 text-sm text-white outline-none ring-primary/40 placeholder:text-white/30 focus:ring-2"
                    placeholder="you@example.com"
                    disabled={Boolean(pendingPlanId)}
                  />
                </label>
                {emailGateError ? <p className="text-sm text-red-400">{emailGateError}</p> : null}
                <div className="flex flex-col-reverse gap-2 pt-1 sm:flex-row sm:justify-end">
                  <Button
                    type="button"
                    variant="secondary"
                    className="w-full sm:w-auto"
                    disabled={Boolean(pendingPlanId)}
                    onClick={closeEmailGate}
                  >
                    Отмена
                  </Button>
                  <Button
                    type="button"
                    className="w-full sm:w-auto"
                    disabled={Boolean(pendingPlanId)}
                    onClick={() => void onConfirmReceiptEmail()}
                  >
                    {pendingPlanId ? 'Создаём платёж…' : 'Продолжить к оплате'}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        </div>
      ) : null}
    </div>
  );
}
