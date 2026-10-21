import { getJson, type Outcome } from '#lib/net/fetch.ts';
import { list, parsed, text, vectorVersion, weakness, type Score, type Weakness } from './types.ts';

export interface AffectedPackage {
  /** GitHub's ecosystem key: npm, pip, maven, rust and so on */
  ecosystem: string;
  name: string;
  range: string;
  patched: string | null;
}

export interface Advisory {
  ghsa: string;
  cve: string | null;
  url: string;
  summary: string;
  description: string;
  severity: string;
  reviewed: boolean;
  published: string;
  updated: string;
  withdrawn: string | null;
  scores: Score[];
  weaknesses: Weakness[];
  packages: AffectedPackage[];
  references: string[];
}

type Json = Record<string, any>;

function scores(severities: Json | undefined): Score[] {
  return [severities?.cvss_v4, severities?.cvss_v3].flatMap((entry) => {
    const vector = text(entry?.vector_string);
    const version = vector ? vectorVersion(vector) : null;
    if (!version) return [];
    return [{ version, vector, score: typeof entry.score === 'number' ? entry.score : null }];
  });
}

export function parseAdvisory(json: unknown): Advisory | null {
  const advisory = json as Json;
  if (!text(advisory?.ghsa_id)) return null;
  return {
    ghsa: text(advisory.ghsa_id),
    cve: text(advisory.cve_id) || null,
    url: text(advisory.html_url) || `https://github.com/advisories/${text(advisory.ghsa_id)}`,
    summary: text(advisory.summary),
    description: text(advisory.description),
    severity: text(advisory.severity),
    reviewed: advisory.type === 'reviewed',
    published: text(advisory.published_at),
    updated: text(advisory.updated_at),
    withdrawn: text(advisory.withdrawn_at) || null,
    scores: scores(advisory.cvss_severities),
    weaknesses: list<Json>(advisory.cwes).map((cwe) =>
      weakness(text(cwe?.cwe_id), text(cwe?.name))
    ),
    packages: list<Json>(advisory.vulnerabilities)
      .filter((entry) => text(entry?.package?.name))
      .map((entry) => ({
        ecosystem: text(entry.package.ecosystem),
        name: text(entry.package.name),
        range: text(entry.vulnerable_version_range),
        patched: text(entry.first_patched_version) || null
      })),
    references: list<string>(advisory.references).filter((url) => typeof url === 'string')
  };
}

const base = 'https://api.github.com/advisories';

export const lookupAdvisory = async (ghsa: string) =>
  parsed(await getJson(`${base}/${ghsa}`), parseAdvisory);

/** a CVE can have several GHSAs (one per ecosystem, say), and none is a missing, not a failure */
export async function advisoriesForCve(cve: string): Promise<Outcome<Advisory[]>> {
  const outcome = parsed(await getJson(`${base}?cve_id=${cve}`), (data) => {
    const advisories = Array.isArray(data) ? data.map(parseAdvisory) : [null];
    return advisories.some((item) => item === null) ? null : (advisories as Advisory[]);
  });
  if (outcome.status === 'ok' && outcome.data.length === 0) return { status: 'missing' };
  return outcome;
}
