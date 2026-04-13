/**
 * Build a vless:// URI for clients. REALITY / TLS params must be supplied via extraQuery
 * (match your inbound streamSettings in 3x-ui).
 */
export function buildVlessUri(input: {
  uuid: string;
  host: string;
  port: number;
  flow?: string;
  extraQuery?: string;
}): string {
  const parts = [`encryption=none`];
  if (input.flow?.trim()) {
    parts.push(`flow=${encodeURIComponent(input.flow.trim())}`);
  }
  if (input.extraQuery?.trim()) {
    const q = input.extraQuery.trim().replace(/^\?/, '');
    parts.push(q);
  }
  return `vless://${input.uuid}@${input.host}:${input.port}?${parts.join('&')}`;
}
