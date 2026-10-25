import { getJson, type Outcome } from '#lib/net/fetch.ts';
import {
  cvssVersion,
  english,
  list,
  parsed,
  text,
  weakness,
  type Reference,
  type Score,
  type Weakness
} from './types.ts';

export interface NvdScore extends Score {
  /** "NVD", "CISA-ADP" or the CNA's contact email */
  source: string;
  primary: boolean;
}

export interface NvdKev {
  added: string;
  due: string;
  action: string;
  name: string;
}

export interface NvdCve {
  id: string;
  /** Analyzed, Awaiting Analysis, Rejected and friends */
  status: string;
  published: string;
  updated: string;
  description: string;
  scores: NvdScore[];
  weaknesses: (Weakness & { source: string })[];
  kev: NvdKev | null;
  references: Reference[];
}

export interface NvdPage {
  total: number;
  items: NvdCve[];
}

type Json = Record<string, any>;

const base = 'https://services.nvd.nist.gov/rest/json/cves/2.0';
export const pageSize = 20;

const sourceNames: Record<string, string> = {
  'nvd@nist.gov': 'NVD',
  '134c704f-9b21-4f2e-91b3-4a467353bcc0': 'CISA-ADP'
};

export const sourceName = (source: string) => sourceNames[source] ?? source;

function scores(metrics: Json | undefined): NvdScore[] {
  return Object.values(metrics ?? {}).flatMap((entries) =>
    list<Json>(entries).flatMap((metric) => {
      const data = metric?.cvssData;
      const version = cvssVersion(data?.version);
      const vector = text(data?.vectorString);
      if (!version || !vector) return [];
      return [
        {
          version,
          vector,
          score: typeof data.baseScore === 'number' ? data.baseScore : null,
          source: sourceName(text(metric.source)),
          primary: metric.type === 'Primary'
        }
      ];
    })
  );
}

export function parseNvdCve(json: Json): NvdCve | null {
  const cve = json?.cve;
  if (!text(cve?.id)) return null;
  return {
    id: text(cve.id),
    status: text(cve.vulnStatus),
    published: text(cve.published),
    updated: text(cve.lastModified),
    description: english(cve.descriptions),
    scores: scores(cve.metrics),
    weaknesses: list<Json>(cve.weaknesses).flatMap((entry) =>
      list<Json>(entry?.description).map((item) => ({
        ...weakness(text(item?.value)),
        source: sourceName(text(entry.source))
      }))
    ),
    kev: cve.cisaExploitAdd
      ? {
          added: text(cve.cisaExploitAdd),
          due: text(cve.cisaActionDue),
          action: text(cve.cisaRequiredAction),
          name: text(cve.cisaVulnerabilityName)
        }
      : null,
    references: list<Json>(cve.references)
      .filter((ref) => text(ref?.url))
      .map((ref) => ({ url: text(ref.url), tags: list<string>(ref.tags) }))
  };
}

export function parseNvdPage(json: unknown): NvdPage | null {
  const body = json as Json;
  if (typeof body?.totalResults !== 'number') return null;
  const items = list<Json>(body.vulnerabilities).map(parseNvdCve);
  if (items.some((item) => item === null)) return null;
  // NVD sometimes sends the same CVE twice in one page
  const unique = new Map((items as NvdCve[]).map((item) => [item.id, item]));
  return { total: body.totalResults, items: [...unique.values()] };
}

// NVD answers a busy client with a bare 403, so name the limit rather than a status code
function explain<T>(outcome: Outcome<T>): Outcome<T> {
  if (
    outcome.status === 'failed' &&
    (outcome.reason === 'rate-limit' || /\b(403|429)\b/.test(outcome.message))
  ) {
    return {
      status: 'failed',
      reason: 'rate-limit',
      message:
        'is rate limiting us (5 requests per 30 seconds without a key), give it half a minute'
    };
  }
  return outcome;
}

const unreadable = {
  status: 'failed',
  reason: 'bad-data',
  message: 'said it had a record but sent nothing we could read'
} as const;

const get = async (query: string) =>
  explain(parsed(await getJson(`${base}?${query}`), parseNvdPage));

export async function lookupNvd(id: string): Promise<Outcome<NvdCve>> {
  const outcome = await get(`cveId=${encodeURIComponent(id)}`);
  if (outcome.status !== 'ok') return outcome;
  const { total, items } = outcome.data;
  if (total === 0) return { status: 'missing' };
  return items[0] ? { status: 'ok', data: items[0] } : unreadable;
}

/** NVD only sorts oldest first, so count the matches and then read pages off the far end */
export async function searchNvd(
  filter: { keyword: string } | { cwe: number },
  page = 0
): Promise<Outcome<NvdPage>> {
  const query =
    'keyword' in filter
      ? `keywordSearch=${encodeURIComponent(filter.keyword)}`
      : `cweId=CWE-${filter.cwe}`;
  const head = await get(`${query}&resultsPerPage=1&startIndex=0`);
  if (head.status !== 'ok') return head;
  const { total } = head.data;
  const end = total - page * pageSize;
  if (end <= 0) return { status: 'ok', data: { total, items: [] } };
  const start = Math.max(0, end - pageSize);
  const window = await get(`${query}&resultsPerPage=${end - start}&startIndex=${start}`);
  if (window.status !== 'ok') return window;
  return { status: 'ok', data: { total, items: window.data.items.reverse() } };
}
