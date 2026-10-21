import { cveIds, detect } from '#lib/ids.ts';

export interface Choice {
  href: string;
  label: string;
}

/** one obvious destination, or a short list when guessing could send someone the wrong way */
export type Routed = { href: string } | { choices: Choice[] } | null;

const q = (value: string) => encodeURIComponent(value);

export function route(input: string): Routed {
  const many = cveIds(input);
  if (many.length > 1) {
    const list = many.join(',');
    return {
      choices: [
        { href: `/epss?cve=${list}`, label: `EPSS scores for all ${many.length}` },
        { href: `/kev?cve=${list}`, label: `Check all ${many.length} against KEV` },
        { href: `/cve?id=${many[0]}`, label: `Look up ${many[0]}` }
      ]
    };
  }

  const found = detect(input);
  if (!found) return null;
  switch (found.kind) {
    case 'cve':
    case 'ghsa':
      return { href: `/cve?id=${found.id}` };
    case 'cwe':
      return { href: `/cwe/${found.id}` };
    case 'cvss':
      return { href: `/cvss?vector=${q(found.vector)}` };
    case 'purl':
      return { href: `/package?q=${q(found.purl)}` };
    case 'url': {
      const cwe = found.url.match(/cwe\.mitre\.org\/data\/definitions\/(\d+)/i);
      // registry and repo links, which the package lookup knows how to read
      return cwe ? { href: `/cwe/${cwe[1]}` } : { href: `/package?q=${q(found.url)}` };
    }
    case 'text':
      return {
        choices: [
          { href: `/cwe?q=${q(found.text)}`, label: `Weaknesses (CWE) matching "${found.text}"` },
          { href: `/cve?q=${q(found.text)}`, label: `CVEs mentioning "${found.text}"` },
          { href: `/package?q=${q(found.text)}`, label: `Packages called "${found.text}"` },
          { href: `/cna?q=${q(found.text)}`, label: `CNAs covering "${found.text}"` }
        ]
      };
  }
}
