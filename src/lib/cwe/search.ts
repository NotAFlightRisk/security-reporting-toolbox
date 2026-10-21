import { cweId } from '#lib/ids.ts';
import type { IndexEntry, Usage } from './types.ts';

export interface Filters {
  kind: IndexEntry['kind'] | 'all';
  usage: Usage | 'any';
  hideRetired: boolean;
}

export const noFilters: Filters = { kind: 'all', usage: 'any', hideRetired: true };

export const retired = (entry: Pick<IndexEntry, 'status'>) =>
  entry.status === 'Deprecated' || entry.status === 'Obsolete';

export const passes = (entry: Pick<IndexEntry, 'kind' | 'usage' | 'status'>, filters: Filters) =>
  (filters.kind === 'all' || entry.kind === filters.kind) &&
  (filters.usage === 'any' || entry.usage === filters.usage) &&
  !(filters.hideRetired && retired(entry));

// when scores tie, nudge people towards the entries MITRE wants them mapping to
const preference: Record<IndexEntry['kind'], number> = {
  Base: 0,
  Variant: 1,
  Compound: 2,
  Class: 3,
  Pillar: 4,
  Category: 5
};

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
const normal = (text: string) => words(text).join(' ');

function score(entry: IndexEntry, raw: string, phrase: string, tokens: string[]) {
  const name = normal(entry.name);
  // "Reflected XSS / Non-Persistent XSS" is really two terms
  const terms = entry.terms.flatMap((term) => term.split(/\s+\/\s+/)).map(normal);
  const summary = normal(entry.summary);
  const named = `${name} ${terms.join(' ')}`;
  const has = (text: string) => tokens.every((token) => text.includes(token));
  const rules: [number, boolean][] = [
    [500, entry.name.toLowerCase() === raw],
    [400, terms.includes(phrase)],
    [300, name.includes(phrase)],
    [250, terms.some((term) => term.includes(phrase))],
    [200, has(name)],
    [150, has(named)],
    [100, summary.includes(phrase)],
    [50, has(`${named} ${summary}`)]
  ];
  const points = rules.find(([, hit]) => hit)?.[0] ?? 0;
  return points && (retired(entry) ? Math.max(1, points - 200) : points);
}

/** ranked matches for an ID or keywords, best first */
export function search(entries: IndexEntry[], query: string) {
  const text = query.trim();
  if (!text) return [];
  const id = cweId(text);
  if (id !== null) return entries.filter((entry) => entry.id === id);

  const tokens = words(text);
  if (!tokens.length) return [];
  const phrase = tokens.join(' ');
  return entries
    .map((entry) => ({ entry, points: score(entry, text.toLowerCase(), phrase, tokens) }))
    .filter(({ points }) => points > 0)
    .sort(
      (a, b) =>
        b.points - a.points ||
        preference[a.entry.kind] - preference[b.entry.kind] ||
        a.entry.id - b.entry.id
    )
    .map(({ entry }) => entry);
}
