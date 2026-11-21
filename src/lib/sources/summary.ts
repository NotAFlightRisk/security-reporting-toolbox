import type { CveRecord } from './cveorg.ts';
import type { Advisory } from './github.ts';
import type { NvdCve } from './nvd.ts';
import type { OsvRecord } from './osv.ts';
import { mergeReferences } from './references.ts';
import type { Reference, Score } from './types.ts';

export interface Sources {
  record: CveRecord | null;
  nvd: NvdCve | null;
  advisories: Advisory[];
  osv: OsvRecord | null;
}

export interface MergedWeakness {
  id: number | null;
  text: string;
  /** who said so, e.g. ["CNA", "GitHub"] */
  sources: string[];
}

/** one row per CWE in the order they were first named, by whoever bothered to name it */
function merge({ record, nvd, advisories }: Sources): MergedWeakness[] {
  const said = [
    ...(record?.cna.weaknesses.map((item) => ({ ...item, source: 'CNA' })) ?? []),
    ...(record?.adp.flatMap((adp) =>
      adp.weaknesses.map((item) => ({ ...item, source: adp.name }))
    ) ?? []),
    ...(nvd?.weaknesses.map((item) => ({
      ...item,
      source: item.source === 'NVD' || item.source === 'CISA-ADP' ? item.source : 'CNA'
    })) ?? []),
    ...advisories.flatMap((advisory) =>
      advisory.weaknesses.map((item) => ({ ...item, source: 'GitHub' }))
    )
  ];
  const merged = new Map<string, MergedWeakness>();
  for (const { id, text, source } of said) {
    const key = id === null ? text : String(id);
    const seen = merged.get(key) ?? { id, text: '', sources: [] };
    seen.text ||= text;
    if (!seen.sources.includes(source)) seen.sources.push(source);
    merged.set(key, seen);
  }
  return [...merged.values()];
}

export const mergeWeaknesses = (sources: Sources) =>
  merge(sources).sort((a, b) => (a.id ?? Infinity) - (b.id ?? Infinity));

/** the CWE to lead with: NVD's primary pick, else the one most sources agree on */
export function mainWeakness(sources: Sources): number | null {
  const primary = sources.nvd?.weaknesses.find((item) => item.primary && item.id !== null);
  if (primary) return primary.id;
  const named = merge(sources).filter((item) => item.id !== null);
  // sort is stable, so a tie goes to whoever spoke first (the CNA)
  return named.sort((a, b) => b.sources.length - a.sources.length)[0]?.id ?? null;
}

/** every other ID this thing is known by, minus the one you looked up */
export function aliases(subject: string, { record, advisories, osv }: Sources) {
  const all = [
    record?.id,
    ...advisories.flatMap((advisory) => [advisory.ghsa, advisory.cve]),
    ...(osv?.aliases ?? []),
    osv?.id
  ];
  return [...new Set(all.filter((id): id is string => Boolean(id) && id !== subject))];
}

export const allReferences = ({ record, nvd, advisories }: Sources): Reference[] =>
  mergeReferences(
    record?.cna.references ?? [],
    nvd?.references ?? [],
    advisories.flatMap((advisory) => advisory.references.map((url) => ({ url, tags: [] })))
  );

const rank: Record<string, number> = { '4.0': 4, '3.1': 3, '3.0': 2, '2.0': 1 };

/** the newest CVSS version with an actual number, for one-line summaries */
export function headlineScore(scores: Score[]): Score | null {
  return (
    scores
      .filter((score) => score.score !== null)
      .sort((a, b) => rank[b.version] - rank[a.version])[0] ?? null
  );
}
