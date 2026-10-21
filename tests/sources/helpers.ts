import { readFileSync } from 'node:fs';
import { vi } from 'vitest';

export const fixture = (name: string) =>
  JSON.parse(readFileSync(new URL(`../fixtures/sources/${name}.json`, import.meta.url), 'utf8'));

/** swaps fetch for a router of url pattern -> [status, body], and records what was asked */
export function fakeFetch(routes: [RegExp, number, unknown][]) {
  const fetch = vi.fn(async (url: string) => {
    const route = routes.find(([pattern]) => pattern.test(url));
    if (!route) throw new TypeError('Failed to fetch');
    const [, status, body] = route;
    return new Response(JSON.stringify(body), { status });
  });
  vi.stubGlobal('fetch', fetch);
  return fetch;
}
