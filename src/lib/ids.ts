// pasted IDs arrive with odd dashes, spaces and zero-width junk, so flatten them first
const tidy = (text: string) =>
  text
    .normalize('NFKC')
    .replace(/[​-‍﻿]/g, '')
    .replace(/[‐-―−]/g, '-')
    .trim();

const cvePattern = /\bCVE[\s_-]*(\d{4})[\s_-]*(\d{4,})\b/i;
const ghsaPattern = /\bGHSA((?:-[23456789cfghjmpqrvwx]{4}){3})\b/i;
const cwePattern = /^(?:CWE[\s_-]*)?(\d{1,5})$/i;
const osvPattern = /\b(RUSTSEC|PYSEC|GO|OSV|MAL)-(\d{4})-(\d+)\b/i;

export function cveId(text: string) {
  const match = tidy(text).match(cvePattern);
  return match ? `CVE-${match[1]}-${match[2]}` : null;
}

export function ghsaId(text: string) {
  const match = tidy(text).match(ghsaPattern);
  return match ? `GHSA${match[1].toLowerCase()}` : null;
}

/** OSV's own IDs, like RUSTSEC-2021-0001 or GO-2022-0969 */
export function osvId(text: string) {
  const match = tidy(text).match(osvPattern);
  return match ? `${match[1].toUpperCase()}-${match[2]}-${match[3]}` : null;
}

/** takes "CWE-79", "cwe79" or a bare "79" */
export function cweId(text: string) {
  const match = tidy(text).match(cwePattern);
  return match ? Number(match[1]) : null;
}

/** every CVE in a blob of text, deduped, in the order they first appear */
export function cveIds(text: string) {
  const found = tidy(text).matchAll(new RegExp(cvePattern.source, 'gi'));
  return [...new Set([...found].map((match) => `CVE-${match[1]}-${match[2]}`))];
}

/** things that had a go at being a CVE ID and missed, like CVE-2021-123 */
export function malformedCves(text: string) {
  const attempts = tidy(text).match(/\bCVE[\s_-]*\d+(?:[\s_-]+\d+)?/gi) ?? [];
  return [...new Set(attempts.filter((attempt) => !cveId(attempt)))];
}

/** a lone broken ID like "CVE-2021-123", which shouldn't turn into a keyword search */
export const brokenCve = (text: string) =>
  malformedCves(text).some((attempt) => attempt.toLowerCase() === tidy(text).toLowerCase());

export type Detected =
  | { kind: 'cve'; id: string }
  | { kind: 'ghsa'; id: string }
  | { kind: 'osv'; id: string }
  | { kind: 'cwe'; id: number }
  | { kind: 'cvss'; vector: string }
  | { kind: 'purl'; purl: string }
  | { kind: 'url'; url: string }
  | { kind: 'text'; text: string };

/** works out what someone pasted, so the home page can send it to the right tool */
export function detect(input: string): Detected | null {
  const text = tidy(input);
  if (!text) return null;
  if (/^CVSS:[34]\.\d\//i.test(text) || /^\(?AV:[NALP]\/AC:[LMH]\//.test(text)) {
    return { kind: 'cvss', vector: text };
  }
  if (/^pkg:/i.test(text)) return { kind: 'purl', purl: text };
  const cve = cveId(text);
  if (cve) return { kind: 'cve', id: cve };
  const ghsa = ghsaId(text);
  if (ghsa) return { kind: 'ghsa', id: ghsa };
  const osv = osvId(text);
  if (osv) return { kind: 'osv', id: osv };
  if (/^CWE/i.test(text) && cweId(text) !== null) return { kind: 'cwe', id: cweId(text)! };
  if (/^https?:\/\//i.test(text)) return { kind: 'url', url: text };
  return { kind: 'text', text };
}
