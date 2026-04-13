/** Mini App URL for Telegram web_app / menu (SPA hash routes). */
export function appUrl(baseUrl: string, path: string): string {
  const trimmedBase = baseUrl.replace(/\/+$/, '');
  if (path === '/') {
    return `${trimmedBase}/`;
  }
  return `${trimmedBase}/#${path}`;
}
