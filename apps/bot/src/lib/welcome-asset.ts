import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

/** Override with absolute path to a replacement image (deploy-friendly). */
const ENV_KEY = 'WELCOME_IMAGE_PATH';

export function resolveWelcomeImagePath(): string | null {
  const fromEnv = process.env[ENV_KEY]?.trim();
  if (fromEnv) {
    return existsSync(fromEnv) ? fromEnv : null;
  }

  const botPackageRoot = dirname(fileURLToPath(import.meta.url));
  const defaultPath = join(botPackageRoot, '..', '..', 'assets', 'welcome.png');
  return existsSync(defaultPath) ? defaultPath : null;
}
