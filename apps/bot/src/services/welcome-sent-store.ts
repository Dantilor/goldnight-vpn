import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

type UserEntry = { welcomed: boolean; lastWelcomeMessageId?: number };
type StoreFileV2 = { v: 2; users: Record<string, UserEntry> };

function dataDirPath(): string {
  const override = process.env.BOT_DATA_DIR?.trim();
  if (override) {
    return join(override, 'bot');
  }
  const botPackageRoot = dirname(fileURLToPath(import.meta.url));
  return join(botPackageRoot, '..', '..', 'data');
}

function storeFilePath(): string {
  return join(dataDirPath(), 'welcome-sent.json');
}

function migrateToV2(raw: unknown): StoreFileV2 {
  if (raw && typeof raw === 'object' && (raw as StoreFileV2).v === 2) {
    const o = raw as StoreFileV2;
    return { v: 2, users: typeof o.users === 'object' && o.users !== null ? o.users : {} };
  }
  const old = raw as { telegramUserIds?: string[] } | null;
  const users: Record<string, UserEntry> = {};
  if (old && Array.isArray(old.telegramUserIds)) {
    for (const id of old.telegramUserIds) {
      users[id] = { welcomed: true };
    }
  }
  return { v: 2, users };
}

async function readStore(): Promise<StoreFileV2> {
  try {
    const raw = await readFile(storeFilePath(), 'utf8');
    return migrateToV2(JSON.parse(raw) as unknown);
  } catch {
    return { v: 2, users: {} };
  }
}

async function writeStore(store: StoreFileV2): Promise<void> {
  const dir = dataDirPath();
  await mkdir(dir, { recursive: true });
  await writeFile(storeFilePath(), `${JSON.stringify(store, null, 0)}\n`, 'utf8');
}

export class WelcomeSentStore {
  async isWelcomed(telegramUserId: string): Promise<boolean> {
    if (!telegramUserId) {
      return false;
    }
    const store = await readStore();
    return store.users[telegramUserId]?.welcomed === true;
  }

  async getLastWelcomeMessageId(telegramUserId: string): Promise<number | undefined> {
    if (!telegramUserId) {
      return undefined;
    }
    const store = await readStore();
    return store.users[telegramUserId]?.lastWelcomeMessageId;
  }

  async setWelcomeMessage(telegramUserId: string, messageId: number, welcomedAfterThis: boolean): Promise<void> {
    if (!telegramUserId) {
      return;
    }
    const store = await readStore();
    const prev = store.users[telegramUserId] ?? { welcomed: false };
    store.users[telegramUserId] = {
      welcomed: welcomedAfterThis || prev.welcomed,
      lastWelcomeMessageId: messageId
    };
    await writeStore(store);
  }

}
