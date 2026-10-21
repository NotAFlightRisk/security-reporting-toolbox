import { getJson, type Outcome } from '#lib/net/fetch.ts';
import { list, parsed, text } from './types.ts';

export interface EpssPoint {
  date: string;
  probability: number;
  percentile: number;
}

export interface EpssScore extends EpssPoint {
  cve: string;
  /** oldest first, only filled in when asked for */
  history: EpssPoint[];
}

type Json = Record<string, any>;

const base = 'https://api.first.org/data/v1/epss';
// the API returns 100 rows by default and caps the cve list at 2,000 characters
export const batchSize = 100;

function point(entry: Json): EpssPoint | null {
  const probability = Number(entry?.epss);
  const percentile = Number(entry?.percentile);
  const date = text(entry?.date);
  if (!date || !Number.isFinite(probability) || !Number.isFinite(percentile)) return null;
  return { date, probability, percentile };
}

export function parseEpss(json: unknown): EpssScore[] | null {
  const body = json as Json;
  if (!Array.isArray(body?.data)) return null;
  return body.data.flatMap((entry: Json) => {
    const current = point(entry);
    const cve = text(entry?.cve).toUpperCase();
    if (!current || !cve) return [];
    const series = list<Json>(entry['time-series']).map(point);
    const byDate = new Map(
      [...series, current].flatMap((item) => (item ? [[item.date, item]] : []))
    );
    const history = [...byDate.values()].sort((a, b) => a.date.localeCompare(b.date));
    return [{ cve, ...current, history: entry['time-series'] ? history : [] }];
  });
}

export function batches<T>(items: T[], size = batchSize) {
  return Array.from({ length: Math.ceil(items.length / size) }, (_, index) =>
    items.slice(index * size, (index + 1) * size)
  );
}

/** scores for any number of CVEs; ones EPSS has never heard of are just absent */
export async function lookupEpss(cves: string[]): Promise<Outcome<Map<string, EpssScore>>> {
  const outcomes = await Promise.all(
    batches(cves).map(async (batch) =>
      parsed(await getJson(`${base}?cve=${batch.join(',')}&limit=${batchSize}`), parseEpss)
    )
  );
  const scores = new Map<string, EpssScore>();
  for (const outcome of outcomes) {
    if (outcome.status === 'failed') return outcome;
    if (outcome.status === 'ok') for (const score of outcome.data) scores.set(score.cve, score);
  }
  return { status: 'ok', data: scores };
}

export async function epssHistory(cve: string): Promise<Outcome<EpssScore>> {
  const outcome = parsed(await getJson(`${base}?cve=${cve}&scope=time-series`), parseEpss);
  if (outcome.status !== 'ok') return outcome;
  return outcome.data[0] ? { status: 'ok', data: outcome.data[0] } : { status: 'missing' };
}
