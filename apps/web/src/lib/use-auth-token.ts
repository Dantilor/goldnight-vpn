import { useSyncExternalStore } from 'react';
import { authStore } from './auth-store';

export function useAuthToken(): string | null {
  return useSyncExternalStore(
    authStore.subscribe,
    () => authStore.getToken(),
    () => null
  );
}
