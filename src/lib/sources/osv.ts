import { getJson } from '#lib/net/fetch.ts';
import { list, parsed, text, vectorVersion, type Score } from './types.ts';

export interface OsvRecord {
  id: string;
  url: string;
  aliases: string[];
  /** OSV's looser links, like distro advisories that cover the same bug */
  related: string[];
  summary: string;
  published: string;
  modified: string;
  withdrawn: string | null;
  scores: Score[];
}

type Json = Record<string, any>;

export function parseOsv(json: unknown): OsvRecord | null {
  const record = json as Json;
  const id = text(record?.id);
  if (!id) return null;
  return {
    id,
    url: `https://osv.dev/vulnerability/${encodeURIComponent(id)}`,
    aliases: list<string>(record.aliases).filter((alias) => typeof alias === 'string'),
    related: list<string>(record.related).filter((alias) => typeof alias === 'string'),
    summary: text(record.summary) || text(record.details).split('\n')[0],
    published: text(record.published),
    modified: text(record.modified),
    withdrawn: text(record.withdrawn) || null,
    scores: list<Json>(record.severity).flatMap((entry) => {
      const vector = text(entry?.score);
      const version = vectorVersion(vector);
      return version ? [{ version, vector, score: null }] : [];
    })
  };
}

export const lookupOsv = async (id: string) =>
  parsed(await getJson(`https://api.osv.dev/v1/vulns/${encodeURIComponent(id)}`), parseOsv);
