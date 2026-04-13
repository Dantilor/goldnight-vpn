import type { AuthUser } from '../types/api';

const TOKEN_KEY = 'goldnight_auth_token';

let currentToken: string | null = localStorage.getItem(TOKEN_KEY);
let currentUser: AuthUser | null = null;

type Listener = () => void;
const listeners = new Set<Listener>();

function emit() {
  listeners.forEach((listener) => listener());
}

export const authStore = {
  getToken() {
    return currentToken;
  },
  setToken(token: string | null) {
    currentToken = token;
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
    emit();
  },
  getUser() {
    return currentUser;
  },
  setUser(user: AuthUser | null) {
    currentUser = user;
    emit();
  },
  clear() {
    currentToken = null;
    currentUser = null;
    localStorage.removeItem(TOKEN_KEY);
    emit();
  },
  subscribe(listener: Listener) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  }
};
