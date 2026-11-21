import { browser } from '$app/env';
import { goto } from '$app/navigation';
import { page } from '$app/state';

/** a search param, or '' while prerendering, since static pages have no query */
export const param = (name: string) => (browser ? (page.url.searchParams.get(name) ?? '') : '');

/** puts tool state in the URL so results can be shared and opened from other tools */
export function setParams(
  values: Record<string, string | null | undefined>,
  { replace = false } = {}
) {
  const url = new URL(page.url.href);
  for (const [name, value] of Object.entries(values)) {
    if (value) url.searchParams.set(name, value);
    else url.searchParams.delete(name);
  }
  return goto(url, { reset: false, replace });
}

/** a ?page= value as a whole page index from 0 up to `last`, whatever got typed in */
export function pageIndex(value: string, last = Infinity) {
  const page = Math.floor(Number(value));
  return Number.isFinite(page) ? Math.max(0, Math.min(page, last)) : 0;
}
