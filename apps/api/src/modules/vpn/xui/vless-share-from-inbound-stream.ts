/**
 * Build the same style of vless:// share URI the 3x-ui panel uses for this inbound:
 * query from inbound `streamSettings` (not from XUI_VLESS_EXTRA_QUERY env),
 * fragment `#vless-{port}-{email}` like the panel export.
 */
export function buildVlessShareUriFromInboundStream(input: {
  uuid: string;
  publicHost: string;
  port: number;
  clientEmail: string;
  streamSettings: unknown;
  /** Optional client.flow from inbound settings (only added when present). */
  clientFlow?: string;
}): string | null {
  let stream: Record<string, unknown>;
  if (typeof input.streamSettings === 'string') {
    try {
      stream = JSON.parse(input.streamSettings) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (input.streamSettings && typeof input.streamSettings === 'object') {
    stream = input.streamSettings as Record<string, unknown>;
  } else {
    return null;
  }

  const network = typeof stream.network === 'string' ? stream.network : 'tcp';
  const security = typeof stream.security === 'string' ? stream.security : 'none';
  if (security === 'reality') {
    return null;
  }
  if (network === 'grpc' || network === 'httpupgrade' || network === 'h2' || network === 'quic') {
    return null;
  }

  let sni: string | undefined;
  let fp: string | undefined;
  let alpn: string | undefined;

  if (security === 'tls') {
    const tls = stream.tlsSettings as Record<string, unknown> | undefined;
    if (tls && typeof tls === 'object') {
      if (typeof tls.serverName === 'string' && tls.serverName.trim()) {
        sni = tls.serverName.trim();
      }
      if (typeof tls.fingerprint === 'string' && tls.fingerprint.trim()) {
        fp = tls.fingerprint.trim();
      }
      if (Array.isArray(tls.alpn) && tls.alpn.length > 0) {
        alpn = tls.alpn.map(String).join(',');
      } else if (typeof tls.alpn === 'string' && tls.alpn.trim()) {
        alpn = tls.alpn.trim();
      }
    }
  }

  const pairs: Array<[string, string]> = [];
  const isXhttp = network === 'xhttp' || network === 'splithttp';

  if (isXhttp) {
    pairs.push(['encryption', 'none']);
    pairs.push(['type', network]);
    const xh = stream.xhttpSettings as Record<string, unknown> | undefined;
    if (xh && typeof xh === 'object') {
      if (typeof xh.mode === 'string' && xh.mode.trim()) {
        pairs.push(['mode', xh.mode.trim()]);
      }
      if (typeof xh.path === 'string' && xh.path.length > 0) {
        pairs.push(['path', xh.path]);
      }
      if (typeof xh.host === 'string' && xh.host.trim()) {
        pairs.push(['host', xh.host.trim()]);
      }
    }
    pairs.push(['security', security]);
    if (fp) pairs.push(['fp', fp]);
    if (alpn) pairs.push(['alpn', alpn]);
    if (sni) pairs.push(['sni', sni]);
  } else {
    pairs.push(['type', network]);
    pairs.push(['encryption', 'none']);
    pairs.push(['security', security]);
    if (fp) pairs.push(['fp', fp]);
    if (alpn) pairs.push(['alpn', alpn]);
    if (sni) pairs.push(['sni', sni]);
    if (network === 'ws') {
      const ws = stream.wsSettings as Record<string, unknown> | undefined;
      if (ws && typeof ws === 'object') {
        if (typeof ws.path === 'string' && ws.path.length > 0) {
          pairs.push(['path', ws.path]);
        }
        if (typeof ws.host === 'string' && ws.host.trim()) {
          pairs.push(['host', ws.host.trim()]);
        }
      }
    }
    const flow = input.clientFlow?.trim();
    if (flow && network === 'tcp') {
      pairs.push(['flow', flow]);
    }
  }

  const query = pairs.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const base = `vless://${input.uuid}@${input.publicHost}:${input.port}?${query}`;
  const frag = `vless-${input.port}-${input.clientEmail}`;
  return `${base}#${frag}`;
}

export function findClientFlowInInboundSettings(settingsJson: string | undefined, clientUuid: string): string | undefined {
  if (!settingsJson?.trim()) return undefined;
  let settings: { clients?: Array<{ id?: string; flow?: string }> };
  try {
    settings = JSON.parse(settingsJson) as { clients?: Array<{ id?: string; flow?: string }> };
  } catch {
    return undefined;
  }
  const c = settings.clients?.find((x) => x?.id === clientUuid);
  const f = c?.flow;
  if (typeof f === 'string' && f.trim()) return f.trim();
  return undefined;
}
