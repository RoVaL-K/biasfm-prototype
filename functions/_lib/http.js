const ALLOWED_ORIGINS = new Set([
  'https://roval-k.github.io',
  'https://biasfm-prototype.pages.dev',
  'http://localhost:3100',
  'http://127.0.0.1:3100'
]);

export function originFor(request) {
  const origin = request.headers.get('Origin');
  return origin && ALLOWED_ORIGINS.has(origin) ? origin : '';
}

export function corsHeaders(request, extra = {}) {
  const origin = originFor(request);
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Vary': 'Origin',
    ...extra
  };
}

export function options(request) {
  return new Response(null, {status: 204, headers: corsHeaders(request)});
}

export function json(request, value, status = 200, extra = {}) {
  return new Response(JSON.stringify(value), {
    status,
    headers: corsHeaders(request, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
      ...extra
    })
  });
}

export function redirect(location) {
  return new Response(null, {
    status: 303,
    headers: {'Location': location, 'Cache-Control': 'no-store'}
  });
}

export function failure(request, error, fallbackStatus = 502) {
  const status = Number.isInteger(error?.status) ? error.status : fallbackStatus;
  return json(request, {error: error?.message || 'Die Anfrage konnte nicht verarbeitet werden.'}, status);
}

export function fail(status, message) {
  return Object.assign(new Error(message), {status});
}

export async function fetchJson(url, init = {}, timeoutMs = 20000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {...init, signal: controller.signal});
    const body = await response.json().catch(() => null);
    return {response, body};
  } finally {
    clearTimeout(timer);
  }
}

export function readCookie(request, name) {
  const prefix = `${name}=`;
  return (request.headers.get('Cookie') || '')
    .split(';')
    .map(value => value.trim())
    .find(value => value.startsWith(prefix))
    ?.slice(prefix.length) || '';
}

export function cookie(name, value, maxAge) {
  return `${name}=${value}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
}

export function safeReturnTo(value, fallback) {
  try {
    const url = new URL(value || fallback);
    if (ALLOWED_ORIGINS.has(url.origin)) return url.href;
  } catch {}
  return fallback;
}

export {ALLOWED_ORIGINS};
