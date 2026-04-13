/**
 * Build a vless:// URI for clients. TLS / REALITY / transport params come from `extraQuery`
 * and must match the inbound `streamSettings` in 3x-ui (copy from panel export).
 *
 * Always sets `encryption=none` and optional `flow` here so they are not duplicated
 * or contradicted by `XUI_VLESS_EXTRA_QUERY` (duplicate keys break some clients).
 *
 * XHTTP (and similar) share links must not include `flow=xtls-rprx-vision` — that is for TCP+XTLS.
 * If `extraQuery` contains `type=xhttp`, `flow` from env is ignored.
 */
export function vlessShareLinkUsesXhttpTransport(extraQuery: string | undefined): boolean {
  const raw = extraQuery?.trim().replace(/^\?/, '') ?? '';
  if (!raw) {
    return false;
  }
  const parsed = new URLSearchParams(raw);
  for (const [key, value] of parsed.entries()) {
    if (key.toLowerCase() === 'type' && value.toLowerCase() === 'xhttp') {
      return true;
    }
  }
  return false;
}

export function buildVlessUri(input: {
  uuid: string;
  host: string;
  port: number;
  flow?: string;
  extraQuery?: string;
}): string {
  const tail = new URLSearchParams();
  const raw = input.extraQuery?.trim().replace(/^\?/, '') ?? '';
  if (raw) {
    const parsed = new URLSearchParams(raw);
    parsed.forEach((value, key) => {
      if (key === 'encryption' || key === 'flow') {
        return;
      }
      tail.set(key, value);
    });
  }

  const isXhttp = vlessShareLinkUsesXhttpTransport(input.extraQuery);

  const head: string[] = ['encryption=none'];
  if (!isXhttp && input.flow?.trim()) {
    head.push(`flow=${encodeURIComponent(input.flow.trim())}`);
  }
  const tailStr = tail.toString();
  const query = tailStr ? `${head.join('&')}&${tailStr}` : head.join('&');
  return `vless://${input.uuid}@${input.host}:${input.port}?${query}`;
}
