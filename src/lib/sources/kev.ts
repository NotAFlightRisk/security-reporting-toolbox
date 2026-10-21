import { getJson, type Outcome } from '#lib/net/fetch.ts';
import type { NvdCve, NvdKev } from './nvd.ts';
import { list, parsed, text } from './types.ts';

export interface KevNote {
  label: string;
  url: string;
}

export interface KevEntry {
  cve: string;
  vendor: string;
  product: string;
  name: string;
  description: string;
  added: string;
  due: string;
  action: string;
  /** CISA only ever says Known or Unknown, never "no" */
  ransomware: boolean;
  notes: KevNote[];
  cwes: number[];
}

export interface KevCatalogue {
  version: string;
  released: string;
  entries: KevEntry[];
  byCve: Map<string, KevEntry>;
}

type Json = Record<string, any>;

export const kevUrl =
  'https://raw.githubusercontent.com/cisagov/kev-data/main/known_exploited_vulnerabilities.json';

/** notes are "url ; label: url ; ; url", so pull out the links and any label in front */
export function parseNotes(notes: string): KevNote[] {
  return notes
    .split(/\s*;\s*/)
    .map((part) => part.trim().match(/^(?:(.+?):\s+)?(https?:\/\/\S+)$/))
    .filter((match) => match !== null)
    .map((match) => ({ label: match[1]?.trim() ?? '', url: match[2] }));
}

function entry(json: Json): KevEntry | null {
  const cve = text(json?.cveID).toUpperCase();
  if (!/^CVE-\d{4}-\d{4,}$/.test(cve)) return null;
  return {
    cve,
    vendor: text(json.vendorProject),
    product: text(json.product),
    name: text(json.vulnerabilityName),
    description: text(json.shortDescription),
    added: text(json.dateAdded),
    due: text(json.dueDate),
    action: text(json.requiredAction),
    ransomware: text(json.knownRansomwareCampaignUse).toLowerCase() === 'known',
    notes: parseNotes(text(json.notes)),
    cwes: list<string>(json.cwes)
      .map((cwe) => Number(String(cwe).match(/^CWE-(\d+)$/i)?.[1]))
      .filter((id) => Number.isInteger(id))
  };
}

export function parseKev(json: unknown): KevCatalogue | null {
  const body = json as Json;
  if (!Array.isArray(body?.vulnerabilities)) return null;
  const entries = body.vulnerabilities
    .map(entry)
    .filter((item: KevEntry | null) => item !== null)
    .sort((a: KevEntry, b: KevEntry) => b.added.localeCompare(a.added));
  return {
    version: text(body.catalogVersion),
    released: text(body.dateReleased),
    entries,
    byCve: new Map(entries.map((item: KevEntry) => [item.cve, item]))
  };
}

export const loadKev = async () => parsed(await getJson(kevUrl), parseKev);

export interface KevFilter {
  text?: string;
  ransomware?: boolean;
  /** only entries added in the last n days */
  days?: number;
}

export function filterKev(entries: KevEntry[], filter: KevFilter, today = new Date()) {
  const words = (filter.text ?? '').toLowerCase().split(/\s+/).filter(Boolean);
  const since = filter.days
    ? new Date(today.getTime() - filter.days * 86_400_000).toISOString().slice(0, 10)
    : '';
  return entries.filter((item) => {
    if (filter.ransomware && !item.ransomware) return false;
    if (since && item.added < since) return false;
    const haystack =
      `${item.cve} ${item.vendor} ${item.product} ${item.name} ${item.description}`.toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}

export type CrossCheck =
  | { kind: 'listed'; kev: NvdKev }
  | { kind: 'agrees' }
  | { kind: 'unknown' }
  | { kind: 'failed'; message: string };

/** what NVD's copy of a CVE says about KEV, when the catalogue copy didn't have it */
export function crossCheck(outcome: Outcome<NvdCve>): CrossCheck {
  if (outcome.status === 'failed') return { kind: 'failed', message: outcome.message };
  if (outcome.status === 'missing') return { kind: 'unknown' };
  return outcome.data.kev ? { kind: 'listed', kev: outcome.data.kev } : { kind: 'agrees' };
}
