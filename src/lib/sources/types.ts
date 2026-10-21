import type { Outcome } from '#lib/net/fetch.ts';

export type CvssVersion = '2.0' | '3.0' | '3.1' | '4.0';

/** runs a parser over a good outcome, and calls it bad data if the parser gives up */
export function parsed<T, U>(outcome: Outcome<T>, parse: (data: T) => U | null): Outcome<U> {
  if (outcome.status !== 'ok') return outcome;
  const data = parse(outcome.data);
  return data === null
    ? { status: 'failed', reason: 'bad-data', message: 'sent back something we could not read' }
    : { status: 'ok', data };
}

export interface Score {
  version: CvssVersion;
  vector: string;
  /** null when a source only gives the vector */
  score: number | null;
}

export interface Weakness {
  /** null for NVD's placeholders like NVD-CWE-noinfo */
  id: number | null;
  text: string;
}

export interface Reference {
  url: string;
  name?: string;
  tags: string[];
}

const versions: CvssVersion[] = ['2.0', '3.0', '3.1', '4.0'];

export const cvssVersion = (value: unknown): CvssVersion | null =>
  versions.find((version) => version === String(value)) ?? null;

/** works out the version from a vector, since v2 vectors have no prefix */
export function vectorVersion(vector: string): CvssVersion | null {
  const prefix = vector.match(/^CVSS:(\d\.\d)\//);
  if (prefix) return cvssVersion(prefix[1]);
  return /^\(?AV:[LAN]\/AC:[HML]\/Au:/.test(vector) ? '2.0' : null;
}

const cwePattern = /^CWE-(\d+)/i;

/** "CWE-79 Improper Neutralization..." or "CWE-79" into an id and its text */
export function weakness(value: string, name?: string): Weakness {
  const match = value.trim().match(cwePattern);
  if (!match) return { id: null, text: placeholderText[value.trim()] ?? value.trim() };
  const rest = value
    .trim()
    .slice(match[0].length)
    .replace(/^[\s:-]+/, '');
  return { id: Number(match[1]), text: name || rest };
}

const placeholderText: Record<string, string> = {
  'NVD-CWE-noinfo': 'Not enough information to pick a CWE',
  'NVD-CWE-Other': 'No CWE fits (NVD-CWE-Other)'
};

export const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');

export const list = <T>(value: unknown): T[] => (Array.isArray(value) ? value : []);

/** the English entry from a [{ lang, value }] list, falling back to the first */
export function english(entries: unknown) {
  const all = list<{ lang?: string; value?: string }>(entries);
  const pick = all.find((entry) => entry?.lang?.toLowerCase().startsWith('en')) ?? all[0];
  return text(pick?.value);
}
