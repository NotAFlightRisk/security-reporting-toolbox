import { getJson } from '#lib/net/fetch.ts';
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

export interface AffectedVersion {
  status: string;
  /** "2.0-beta9 to before 2.15.0", readable rather than the raw CVE JSON shape */
  text: string;
}

export interface AffectedProduct {
  vendor: string;
  product: string;
  versions: AffectedVersion[];
}

export interface Ssvc {
  exploitation: string;
  automatable: string;
  impact: string;
}

export interface Container {
  /** CNA or ADP short name, e.g. "apache" or "CISA-ADP" */
  name: string;
  scores: Score[];
  weaknesses: Weakness[];
  references: Reference[];
}

export interface CveRecord {
  id: string;
  state: string;
  assigner: string;
  published: string;
  updated: string;
  title: string;
  description: string;
  rejectedReason: string;
  cna: Container;
  affected: AffectedProduct[];
  adp: (Container & { kevAdded: string | null; ssvc: Ssvc | null })[];
}

type Json = Record<string, any>;

const metricKeys: [string, '2.0' | '3.0' | '3.1' | '4.0'][] = [
  ['cvssV4_0', '4.0'],
  ['cvssV3_1', '3.1'],
  ['cvssV3_0', '3.0'],
  ['cvssV2_0', '2.0']
];

function scores(metrics: unknown): Score[] {
  return list<Json>(metrics).flatMap((metric) =>
    metricKeys.flatMap(([key, fallback]) => {
      const data = metric?.[key];
      const vector = text(data?.vectorString);
      if (!vector) return [];
      const score = typeof data.baseScore === 'number' ? data.baseScore : null;
      return [{ version: cvssVersion(data.version) ?? fallback, vector, score }];
    })
  );
}

function weaknesses(problemTypes: unknown): Weakness[] {
  return list<Json>(problemTypes)
    .flatMap((problem) => list<Json>(problem?.descriptions))
    .map((entry) => {
      const id = text(entry?.cweId);
      const description = text(entry?.description);
      return id ? weakness(id, weakness(description).text) : weakness(description);
    })
    .filter((entry) => entry.text || entry.id !== null);
}

function references(refs: unknown): Reference[] {
  return list<Json>(refs)
    .filter((ref) => text(ref?.url))
    .map((ref) => ({
      url: text(ref.url),
      name: text(ref.name) || undefined,
      tags: list<string>(ref.tags).filter((tag) => typeof tag === 'string')
    }));
}

function container(json: Json | undefined, fallbackName: string): Container {
  return {
    name: text(json?.providerMetadata?.shortName) || fallbackName,
    scores: scores(json?.metrics),
    weaknesses: weaknesses(json?.problemTypes),
    references: references(json?.references)
  };
}

const range = (from: string, to: string, inclusive: boolean) => {
  const start = !from || from === '0' || from === '*' ? 'all versions' : from;
  return `${start} to ${inclusive ? 'and including' : 'before'} ${to}`;
};

/** turns one CVE JSON 5 version entry into readable lines */
export function describeVersion(entry: Json): AffectedVersion[] {
  const status = text(entry?.status) || 'unknown';
  const from = text(entry?.version);
  const upper = text(entry?.lessThan) || text(entry?.lessThanOrEqual);
  const main = upper ? range(from, upper, !entry.lessThan) : from;
  const changes = list<Json>(entry?.changes).map((change) => ({
    status: text(change?.status) || 'unknown',
    text: `from ${text(change?.at)}`
  }));
  return [{ status, text: main || 'unspecified' }, ...changes];
}

function affected(entries: unknown): AffectedProduct[] {
  return list<Json>(entries).map((entry) => ({
    vendor: text(entry?.vendor) || text(entry?.collectionURL) || 'Unknown vendor',
    product: text(entry?.product) || text(entry?.packageName) || 'Unknown product',
    versions: list<Json>(entry?.versions).flatMap(describeVersion)
  }));
}

function other(metrics: unknown, type: string): Json | undefined {
  return list<Json>(metrics).find((metric) => metric?.other?.type === type)?.other?.content;
}

function ssvc(content: Json | undefined): Ssvc | null {
  if (!content) return null;
  const options = Object.assign({}, ...list<Json>(content.options));
  return {
    exploitation: text(options.Exploitation),
    automatable: text(options.Automatable),
    impact: text(options['Technical Impact'])
  };
}

export function parseCveRecord(json: unknown): CveRecord | null {
  const record = json as Json;
  const meta = record?.cveMetadata;
  if (!meta?.cveId) return null;
  const cna = record.containers?.cna ?? {};
  return {
    id: text(meta.cveId),
    state: text(meta.state) || 'UNKNOWN',
    assigner: text(meta.assignerShortName),
    published: text(meta.datePublished),
    updated: text(meta.dateUpdated),
    title: text(cna.title),
    description: english(cna.descriptions),
    rejectedReason: english(cna.rejectedReasons),
    cna: container(cna, text(meta.assignerShortName) || 'CNA'),
    affected: affected(cna.affected),
    adp: list<Json>(record.containers?.adp).map((adp) => ({
      ...container(adp, 'ADP'),
      kevAdded: text(other(adp.metrics, 'kev')?.dateAdded) || null,
      ssvc: ssvc(other(adp.metrics, 'ssvc'))
    }))
  };
}

export const lookupCveRecord = async (id: string) =>
  parsed(await getJson(`https://cveawg.mitre.org/api/cve/${id}`), parseCveRecord);
