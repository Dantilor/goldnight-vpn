/**
 * Build a vless:// URI for clients. TLS / REALITY / transport params come from `extraQuery`
 * and must match the inbound `streamSettings` in 3x-ui (copy from panel export).
 *
 * Always sets `encryption=none` and optional `flow` here so they are not duplicated
 * or contradicted by `XUI_VLESS_EXTRA_QUERY` (duplicate keys break some clients).
 */
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

  const head: string[] = ['encryption=none'];
  if (input.flow?.trim()) {
    head.push(`flow=${encodeURIComponent(input.flow.trim())}`);
  }
  const tailStr = tail.toString();
  const query = tailStr ? `${head.join('&')}&${tailStr}` : head.join('&');
  return `vless://${input.uuid}@${input.host}:${input.port}?${query}`;
}
