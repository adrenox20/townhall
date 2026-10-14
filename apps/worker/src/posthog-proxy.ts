const POSTHOG_INGEST_HOST = 'us.i.posthog.com';
const POSTHOG_ASSETS_HOST = 'us-assets.i.posthog.com';
export const POSTHOG_PROXY_PREFIX = '/ingest';

// Forwards /ingest/* to PostHog so analytics are not dropped by ad blockers.
export function proxyPostHog(request: Request): Promise<Response> {
  const url = new URL(request.url);
  const path = url.pathname.slice(POSTHOG_PROXY_PREFIX.length) || '/';
  const host = path.startsWith('/static/') ? POSTHOG_ASSETS_HOST : POSTHOG_INGEST_HOST;
  const target = new URL(`https://${host}${path}${url.search}`);

  const headers = new Headers(request.headers);
  headers.delete('cookie');
  headers.set('host', host);
  const clientIp = request.headers.get('cf-connecting-ip');
  if (clientIp) headers.set('x-forwarded-for', clientIp);

  const hasBody = request.method !== 'GET' && request.method !== 'HEAD';
  return fetch(target, {
    method: request.method,
    headers,
    body: hasBody ? request.body : undefined,
    redirect: 'manual',
  });
}
