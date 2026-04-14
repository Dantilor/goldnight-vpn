import { buildVlessUri, vlessShareLinkUsesXhttpTransport } from './build-vless-uri.js';
import {
  buildVlessShareUriFromInboundStream,
  findClientFlowInInboundSettings
} from './vless-share-from-inbound-stream.js';

export type XuiClientConfig = {
  host: string;
  basePath: string;
  username: string;
  password: string;
  inboundId: number;
  publicHost: string;
  publicPort: number;
  vlessFlow?: string;
  vlessExtraQuery?: string;
  /** 3x-ui client limitIp (0 = unlimited). Default applied in factory is 1. */
  clientLimitIp: number;
};

type MsgResponse<T> = {
  success: boolean;
  msg?: string;
  obj?: T;
};

function normalizeBasePath(basePath: string): string {
  if (!basePath || basePath === '/') {
    return '';
  }
  const withSlash = basePath.startsWith('/') ? basePath : `/${basePath}`;
  return withSlash.replace(/\/$/, '');
}

function joinPaths(origin: string, basePath: string, suffix: string): string {
  const o = origin.replace(/\/$/, '');
  const b = normalizeBasePath(basePath);
  const s = suffix.startsWith('/') ? suffix : `/${suffix}`;
  return `${o}${b}${s}`;
}

export type XuiInboundRow = {
  id: number;
  protocol?: string;
  port?: number;
  remark?: string;
  settings?: string;
  /** Inbound stream settings (JSON string or object) — source of truth for panel share links. */
  streamSettings?: string | Record<string, unknown>;
};

export type XuiAddClientInput = {
  uuid: string;
  email: string;
  flow?: string;
  subId: string;
};

/**
 * Minimal 3x-ui panel HTTP client (session cookie after login).
 * addClient uses POST /panel/api/inbounds/addClient — the panel merges new clients into
 * existing inbound settings (append, not replace). We still fetch the inbound first to
 * validate id and avoid blind calls.
 */
export class ThreeXUiClient {
  private cookieHeader = '';
  private loginExpiresAt = 0;

  constructor(private readonly cfg: XuiClientConfig) {}

  private loginUrl(): string {
    return joinPaths(this.cfg.host, this.cfg.basePath, '/login');
  }

  private apiUrl(suffix: string): string {
    return joinPaths(this.cfg.host, this.cfg.basePath, `/panel/api${suffix}`);
  }

  private collectSetCookie(res: Response): void {
    const anyHeaders = res.headers as unknown as { getSetCookie?: () => string[] };
    const parts = typeof anyHeaders.getSetCookie === 'function' ? anyHeaders.getSetCookie() : [];
    if (parts.length > 0) {
      this.cookieHeader = parts.map((c) => c.split(';')[0]!.trim()).join('; ');
      return;
    }
    const single = res.headers.get('set-cookie');
    if (single) {
      this.cookieHeader = single
        .split(/,(?=[^;]+?=)/)
        .map((c) => c.split(';')[0]!.trim())
        .join('; ');
    }
  }

  async login(): Promise<void> {
    const body = new URLSearchParams({
      username: this.cfg.username,
      password: this.cfg.password
    });
    const res = await fetch(this.loginUrl(), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Accept: 'application/json',
        ...(this.cookieHeader ? { Cookie: this.cookieHeader } : {})
      },
      body,
      redirect: 'manual'
    });
    this.collectSetCookie(res);
    const data = (await res.json()) as MsgResponse<unknown>;
    if (!data.success) {
      throw new Error(`x-ui login failed: ${data.msg ?? res.statusText}`);
    }
    this.loginExpiresAt = Date.now() + 25 * 60 * 1000;
  }

  private async ensureSession(): Promise<void> {
    if (this.cookieHeader && Date.now() < this.loginExpiresAt) {
      return;
    }
    await this.login();
  }

  private async apiPostJson<T>(path: string, jsonBody: unknown): Promise<T> {
    await this.ensureSession();
    const res = await fetch(this.apiUrl(path), {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Cookie: this.cookieHeader
      },
      body: JSON.stringify(jsonBody)
    });
    this.collectSetCookie(res);
    const data = (await res.json()) as MsgResponse<T>;
    if (!data.success) {
      if (res.status === 404 || (data.msg && /login/i.test(data.msg))) {
        this.cookieHeader = '';
        this.loginExpiresAt = 0;
      }
      throw new Error(`x-ui ${path} failed: ${data.msg ?? res.statusText}`);
    }
    return data.obj as T;
  }

  private async apiGetJson<T>(path: string): Promise<T> {
    await this.ensureSession();
    const res = await fetch(this.apiUrl(path), {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Cookie: this.cookieHeader
      }
    });
    const data = (await res.json()) as MsgResponse<T>;
    if (!data.success) {
      if (res.status === 404 || (data.msg && /login/i.test(data.msg))) {
        this.cookieHeader = '';
        this.loginExpiresAt = 0;
      }
      throw new Error(`x-ui GET ${path} failed: ${data.msg ?? res.statusText}`);
    }
    return data.obj as T;
  }

  async listInbounds(): Promise<XuiInboundRow[]> {
    const obj = await this.apiGetJson<XuiInboundRow[]>('/inbounds/list');
    return Array.isArray(obj) ? obj : [];
  }

  async getInbound(id: number): Promise<XuiInboundRow> {
    return this.apiGetJson<XuiInboundRow>(`/inbounds/get/${id}`);
  }

  /** True if this VLESS client id is present on the configured inbound (panel source of truth). */
  async clientExistsInInbound(clientUuid: string): Promise<boolean> {
    const inbound = await this.getInbound(this.cfg.inboundId);
    const raw = inbound?.settings;
    if (typeof raw !== 'string' || !raw.trim()) {
      return false;
    }
    let settings: { clients?: unknown };
    try {
      settings = JSON.parse(raw) as { clients?: unknown };
    } catch {
      return false;
    }
    const clients = settings.clients;
    if (!Array.isArray(clients)) {
      return false;
    }
    return clients.some((c) => {
      if (!c || typeof c !== 'object') return false;
      const id = (c as { id?: string }).id;
      return typeof id === 'string' && id === clientUuid;
    });
  }

  /**
   * Add a single VLESS client. Body matches 3x-ui model.Inbound: id + settings JSON string
   * with a clients array containing only the new client. Server-side AddInboundClient appends
   * these clients to the existing list (see inbound.go append).
   */
  async addClient(input: XuiAddClientInput): Promise<void> {
    const inbound = await this.getInbound(this.cfg.inboundId);
    if (!inbound?.id) {
      throw new Error(`x-ui inbound ${this.cfg.inboundId} not found`);
    }
    const client: Record<string, unknown> = {
      id: input.uuid,
      email: input.email,
      enable: true,
      limitIp: this.cfg.clientLimitIp,
      totalGB: 0,
      expiryTime: 0,
      tgId: 0,
      subId: input.subId,
      reset: 0
    };
    if (input.flow?.trim()) {
      client.flow = input.flow.trim();
    }
    const settingsStr = JSON.stringify({ clients: [client] });
    await this.apiPostJson<unknown>('/inbounds/addClient', {
      id: this.cfg.inboundId,
      settings: settingsStr
    });
  }

  async deleteClient(clientUuid: string): Promise<void> {
    await this.ensureSession();
    const path = `/inbounds/${this.cfg.inboundId}/delClient/${encodeURIComponent(clientUuid)}`;
    const res = await fetch(this.apiUrl(path), {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        Cookie: this.cookieHeader
      }
    });
    const data = (await res.json()) as MsgResponse<unknown>;
    if (!data.success) {
      throw new Error(`x-ui delClient failed: ${data.msg ?? res.statusText}`);
    }
  }

  buildVlessLink(uuid: string): string {
    return buildVlessUri({
      uuid,
      host: this.cfg.publicHost,
      port: this.cfg.publicPort,
      ...(this.cfg.vlessFlow !== undefined && this.cfg.vlessFlow !== ''
        ? { flow: this.cfg.vlessFlow }
        : {}),
      ...(this.cfg.vlessExtraQuery !== undefined && this.cfg.vlessExtraQuery !== ''
        ? { extraQuery: this.cfg.vlessExtraQuery }
        : {})
    });
  }

  /**
   * Same raw vless:// line as the 3x-ui panel export (query from inbound streamSettings, not env template).
   * Falls back to {@link buildVlessLink} when inbound data is missing or unsupported (e.g. REALITY).
   */
  async buildVlessShareLinkMatchingPanel(uuid: string, clientEmail: string): Promise<string> {
    try {
      const inbound = await this.getInbound(this.cfg.inboundId);
      const port = typeof inbound.port === 'number' && inbound.port > 0 ? inbound.port : this.cfg.publicPort;
      const clientFlow = findClientFlowInInboundSettings(inbound.settings, uuid);
      const fromStream = buildVlessShareUriFromInboundStream({
        uuid,
        publicHost: this.cfg.publicHost,
        port,
        clientEmail,
        streamSettings: inbound.streamSettings,
        ...(clientFlow ? { clientFlow } : {})
      });
      if (fromStream) {
        return fromStream;
      }
    } catch {
      // fall through
    }
    return this.buildVlessLink(uuid);
  }
}

export function createXuiClientFromEnv(
  env: {
    XUI_HOST: string;
    XUI_BASE_PATH: string;
    XUI_USER: string;
    XUI_PASS: string;
    XUI_INBOUND_ID: number;
    XUI_DOMAIN: string;
    XUI_PORT: number;
  } & Partial<{ XUI_VLESS_FLOW: string; XUI_VLESS_EXTRA_QUERY: string; XUI_CLIENT_LIMIT_IP: number }>
): ThreeXUiClient {
  const clientLimitIp = env.XUI_CLIENT_LIMIT_IP ?? 1;
  const xhttp = vlessShareLinkUsesXhttpTransport(env.XUI_VLESS_EXTRA_QUERY);
  const flowForUri =
    !xhttp && env.XUI_VLESS_FLOW !== undefined && env.XUI_VLESS_FLOW !== '' ? env.XUI_VLESS_FLOW : undefined;
  return new ThreeXUiClient({
    host: env.XUI_HOST,
    basePath: env.XUI_BASE_PATH,
    username: env.XUI_USER,
    password: env.XUI_PASS,
    inboundId: env.XUI_INBOUND_ID,
    publicHost: env.XUI_DOMAIN,
    publicPort: env.XUI_PORT,
    clientLimitIp,
    ...(flowForUri !== undefined ? { vlessFlow: flowForUri } : {}),
    ...(env.XUI_VLESS_EXTRA_QUERY !== undefined && env.XUI_VLESS_EXTRA_QUERY !== ''
      ? { vlessExtraQuery: env.XUI_VLESS_EXTRA_QUERY }
      : {})
  });
}
