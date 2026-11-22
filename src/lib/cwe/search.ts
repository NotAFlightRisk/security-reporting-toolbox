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

// OWASP-style qualifiers that CWE names tend to word differently, or not at all
const vague = new Set(['broken', 'improper', 'incorrect', 'insecure', 'insufficient', 'unsafe']);

const words = (text: string) =>
  text
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
const normal = (text: string) => words(text).join(' ');

// hyphenated words both ways, so hard-coded is there as hard coded and hardcoded
const searchable = (text: string) => `${normal(text)} | ${normal(text.replace(/\b-\b/g, ''))}`;

/** a phrase from the start of a word, typed with or without its spaces */
const found = (text: string, part: string) =>
  ` ${text}`.includes(` ${part}`) || ` ${text}`.includes(` ${part.replaceAll(' ', '')}`);

function score(entry: IndexEntry, raw: string, phrase: string, tokens: string[]) {
  // "Reflected XSS / Non-Persistent XSS" is really two terms
  const split = entry.terms.flatMap((term) => term.split(/\s+\/\s+/));
  const terms = split.map(searchable);
  const name = searchable(entry.name);
  const summary = searchable(entry.summary);
  const named = [name, ...terms].join(' | ');
  const has = (text: string, needed = tokens) => needed.every((token) => found(text, token));
  const core = tokens.filter((token) => !vague.has(token));
  const rules: [number, boolean][] = [
    [500, entry.name.toLowerCase() === raw],
    [400, split.map(normal).includes(phrase)],
    [300, found(name, phrase)],
    [250, terms.some((term) => found(term, phrase))],
    [200, has(name)],
    [150, has(named)],
    [100, found(summary, phrase)],
    [50, has(`${named} ${summary}`)],
    [25, core.length > 0 && core.length < tokens.length && has(named, core)]
  ];
  const points = rules.find(([, hit]) => hit)?.[0] ?? 0;
  const penalty = (retired(entry) ? 200 : 0) + (entry.usage === 'Discouraged' ? 50 : 0);
  return points && Math.max(1, points - penalty);
}

// can't be mapped to, so they go after everything that can
const sunk = (entry: IndexEntry) => Number(entry.usage === 'Prohibited');

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
        sunk(a.entry) - sunk(b.entry) ||
        b.points - a.points ||
        preference[a.entry.kind] - preference[b.entry.kind] ||
        a.entry.id - b.entry.id
    )
    .map(({ entry }) => entry);
}
