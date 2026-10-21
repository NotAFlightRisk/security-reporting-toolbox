import { getJson } from '#lib/net/fetch.ts';

// the CVE Program's own partner list, the same file cve.org's directory is built from
export const cnaListUrl =
  'https://raw.githubusercontent.com/CVEProject/cve-website/main/src/assets/data/CNAsList.json';

export const partnerPage = (shortName: string) =>
  `https://www.cve.org/PartnerInformation/ListofPartners/partner/${encodeURIComponent(shortName)}`;

interface Link {
  label: string;
  url: string;
}

export interface Cna {
  id: string;
  shortName: string;
  org: string;
  scope: string;
  types: string[];
  roles: string[];
  country: string;
  root: string;
  emails: string[];
  links: Link[];
  policies: Link[];
  advisories: Link[];
}

type Raw = Record<string, unknown>;

const list = (value: unknown): Raw[] =>
  Array.isArray(value) ? value.filter((item) => item && typeof item === 'object') : [];
const text = (value: unknown) => (typeof value === 'string' ? value.trim() : '');
const links = (items: Raw[]) =>
  items
    .map((item) => ({ label: text(item.label) || 'Link', url: text(item.url) }))
    .filter((item) => /^https?:\/\//i.test(item.url));

/** turns one raw record into something flat, dropping anything unusable rather than throwing */
export function normalise(raw: Raw): Cna | null {
  const org = text(raw.organizationName);
  const shortName = text(raw.shortName);
  if (!org || !shortName) return null;
  const cna = (raw.CNA ?? {}) as Raw;
  const root = (cna.root ?? {}) as Raw;
  const contact = list(raw.contact);
  const advisories = (raw.securityAdvisories ?? {}) as Raw;
  return {
    id: text(raw.cnaID),
    shortName,
    org,
    scope: text(raw.scope),
    types: (Array.isArray(cna.type) ? cna.type : []).map(text).filter((t) => t && t !== 'N/A'),
    roles: list(cna.roles)
      .map((role) => text(role.role))
      .filter(Boolean),
    country: text(raw.country),
    root: text(root.organizationName).replace(/^n\/a$/i, ''),
    emails: contact
      .flatMap((group) => list(group.email).map((item) => text(item.emailAddr)))
      .filter((email) => email.includes('@')),
    links: links(contact.flatMap((group) => [...list(group.contact), ...list(group.form)])),
    policies: links(list(raw.disclosurePolicy)),
    advisories: links([...list(advisories.advisories), ...list(advisories.alerts)])
  };
}

export async function loadCnas() {
  const outcome = await getJson<unknown>(cnaListUrl);
  if (outcome.status !== 'ok') return outcome;
  if (!Array.isArray(outcome.data)) {
    return { status: 'failed', reason: 'bad-data', message: 'sent back something odd' } as const;
  }
  const cnas = outcome.data
    .map((raw) => normalise(raw as Raw))
    .filter((cna): cna is Cna => cna !== null)
    .sort((a, b) => a.org.localeCompare(b.org));
  return { status: 'ok', data: cnas } as const;
}

export interface Filters {
  query: string;
  type: string;
  role: string;
}

const fold = (value: string) => value.toLowerCase().normalize('NFKD').replace(/[̀-ͯ]/g, '');

/** best first: names, then short names, then the scope text, where product names live */
function rank(cna: Cna, words: string[]) {
  const name = fold(`${cna.org} ${cna.shortName}`);
  const scope = fold(cna.scope);
  let score = 0;
  for (const word of words) {
    if (fold(cna.shortName) === word || fold(cna.org) === word) score += 100;
    else if (name.includes(word)) score += 10;
    else if (scope.includes(word)) score += 3;
    else return 0;
  }
  return score;
}

export function search(cnas: Cna[], { query, type, role }: Filters) {
  const words = fold(query).split(/\s+/).filter(Boolean);
  const kept = cnas.filter(
    (cna) => (!type || cna.types.includes(type)) && (!role || cna.roles.includes(role))
  );
  if (!words.length) return kept;
  return kept
    .map((cna) => ({ cna, score: rank(cna, words) }))
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .map(({ cna }) => cna);
}

/** every value seen for a field, most common first, for the filter cells */
export function tally(cnas: Cna[], pick: (cna: Cna) => string[]) {
  const counts = new Map<string, number>();
  for (const value of cnas.flatMap(pick)) counts.set(value, (counts.get(value) ?? 0) + 1);
  return [...counts].sort((a, b) => b[1] - a[1]);
}
