import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const LEGACY_PLAN_CODES = ['starter_monthly', 'standard_monthly', 'pro_quarterly', 'ultimate_yearly'] as const;

const plans = [
  {
    code: 'basic_30',
    name: 'Базовый 30 дней',
    durationDays: 30,
    priceRub: 149,
    deviceLimit: 1,
    subtitle: 'Для одного устройства',
    sortOrder: 1
  },
  {
    code: 'basic_90',
    name: 'Базовый 90 дней',
    durationDays: 90,
    priceRub: 399,
    deviceLimit: 1,
    subtitle: 'Для одного устройства',
    sortOrder: 2
  },
  {
    code: 'basic_180',
    name: 'Базовый 180 дней',
    durationDays: 180,
    priceRub: 699,
    deviceLimit: 1,
    subtitle: 'Для одного устройства',
    sortOrder: 3
  },
  {
    code: 'basic_365',
    name: 'Базовый 365 дней',
    durationDays: 365,
    priceRub: 1490,
    deviceLimit: 1,
    subtitle: 'Для одного устройства',
    sortOrder: 4
  },
  {
    code: 'standard_30',
    name: 'Стандарт 30 дней',
    durationDays: 30,
    priceRub: 249,
    deviceLimit: 3,
    subtitle: 'Телефон, ПК и ещё одно устройство',
    sortOrder: 5
  },
  {
    code: 'standard_90',
    name: 'Стандарт 90 дней',
    durationDays: 90,
    priceRub: 649,
    deviceLimit: 3,
    subtitle: 'Телефон, ПК и ещё одно устройство',
    sortOrder: 6
  },
  {
    code: 'standard_180',
    name: 'Стандарт 180 дней',
    durationDays: 180,
    priceRub: 1190,
    deviceLimit: 3,
    subtitle: 'Телефон, ПК и ещё одно устройство',
    sortOrder: 7
  },
  {
    code: 'standard_365',
    name: 'Стандарт 365 дней',
    durationDays: 365,
    priceRub: 2290,
    deviceLimit: 3,
    subtitle: 'Телефон, ПК и ещё одно устройство',
    sortOrder: 8
  },
  {
    code: 'premium_30',
    name: 'Премиум 30 дней',
    durationDays: 30,
    priceRub: 349,
    deviceLimit: 5,
    subtitle: 'Для нескольких устройств',
    sortOrder: 9
  },
  {
    code: 'premium_90',
    name: 'Премиум 90 дней',
    durationDays: 90,
    priceRub: 899,
    deviceLimit: 5,
    subtitle: 'Для нескольких устройств',
    sortOrder: 10
  },
  {
    code: 'premium_180',
    name: 'Премиум 180 дней',
    durationDays: 180,
    priceRub: 1590,
    deviceLimit: 5,
    subtitle: 'Для нескольких устройств',
    sortOrder: 11
  },
  {
    code: 'premium_365',
    name: 'Премиум 365 дней',
    durationDays: 365,
    priceRub: 2990,
    deviceLimit: 5,
    subtitle: 'Для нескольких устройств',
    sortOrder: 12
  }
] as const;

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { code: plan.code },
      update: {
        name: plan.name,
        priceUsd: 0,
        priceRub: plan.priceRub,
        durationDays: plan.durationDays,
        deviceLimit: plan.deviceLimit,
        subtitle: plan.subtitle,
        sortOrder: plan.sortOrder,
        active: true
      },
      create: {
        code: plan.code,
        name: plan.name,
        priceUsd: 0,
        priceRub: plan.priceRub,
        durationDays: plan.durationDays,
        deviceLimit: plan.deviceLimit,
        subtitle: plan.subtitle,
        sortOrder: plan.sortOrder,
        active: true
      }
    });
  }

  await prisma.plan.updateMany({
    where: { code: { in: [...LEGACY_PLAN_CODES] } },
    data: { active: false }
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
