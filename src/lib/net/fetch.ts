export type Failure = 'rate-limit' | 'network' | 'server' | 'bad-data';

/** missing means the source answered and has no such record, failed means we couldn't ask */
export type Outcome<T> =
  | { status: 'ok'; data: T }
  | { status: 'missing' }
  | { status: 'failed'; reason: Failure; message: string };

export const failureText: Record<Failure, string> = {
  'rate-limit': 'is rate limiting requests right now, give it a minute',
  network: "couldn't be reached (offline, blocked, or down)",
  server: 'had a problem answering',
  'bad-data': 'sent back something we could not read'
};

const cache = new Map<string, Promise<Outcome<unknown>>>();

const failed = (reason: Failure, message = failureText[reason]) =>
  ({ status: 'failed', reason, message }) as const;

async function request<T>(url: string, init: RequestInit, missing: number[]): Promise<Outcome<T>> {
  let response: Response;
  try {
    response = await fetch(url, { ...init, signal: AbortSignal.timeout(20_000) });
  } catch {
    return failed('network');
  }
  if (missing.includes(response.status)) return { status: 'missing' };
  if (response.status === 429) return failed('rate-limit');
  if (response.status === 403 && response.headers.get('x-ratelimit-remaining') === '0') {
    return failed('rate-limit');
  }
  if (!response.ok) return failed('server', `answered ${response.status}`);
  try {
    return { status: 'ok', data: (await response.json()) as T };
  } catch {
    return failed('bad-data');
  }
}

/** GETs JSON once per session per url, and remembers everything but failures */
export function getJson<T>(url: string, options: { missing?: number[] } = {}): Promise<Outcome<T>> {
  const hit = cache.get(url) as Promise<Outcome<T>> | undefined;
  if (hit) return hit;
  const pending = request<T>(url, {}, options.missing ?? [404]);
  cache.set(url, pending);
  pending.then((outcome) => outcome.status === 'failed' && cache.delete(url));
  return pending;
}

export function postJson<T>(url: string, body: unknown, options: { missing?: number[] } = {}) {
  const init = { method: 'POST', body: JSON.stringify(body) };
  return request<T>(url, init, options.missing ?? [404]);
}
