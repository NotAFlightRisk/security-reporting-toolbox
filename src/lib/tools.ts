export type ToolId = 'cwe' | 'cve' | 'cvss' | 'epss' | 'kev' | 'versions' | 'package' | 'cna';

export interface Tool {
  id: ToolId;
  path: `/${string}`;
  /** short name for tabs and crumbs */
  name: string;
  title: string;
  /** the one sentence under the title, also the meta description */
  lede: string;
  /** what you can do with it, shown on the home matrix */
  can: string[];
}

export const tools: Tool[] = [
  {
    id: 'cwe',
    path: '/cwe',
    name: 'CWE',
    title: 'CWE explorer',
    lede: 'Find the right CWE for a vulnerability, with its description, consequences, mitigations and what MITRE says about mapping to it.',
    can: [
      'Search by ID or keyword',
      'Top 25 and OWASP views',
      'Mapping guidance',
      'Related weaknesses'
    ]
  },
  {
    id: 'cve',
    path: '/cve',
    name: 'CVE',
    title: 'CVE and GHSA lookup',
    lede: 'Look up a CVE or GitHub advisory and see what CVE.org, NVD, GitHub and OSV each say about it, side by side.',
    can: [
      'CVE and GHSA IDs',
      'Scores from each source',
      'Affected and fixed versions',
      'Cross-referenced aliases'
    ]
  },
  {
    id: 'cvss',
    path: '/cvss',
    name: 'CVSS',
    title: 'CVSS calculator',
    lede: 'Score a vulnerability with CVSS 3.1 or 4.0, or paste a vector to decode, check and explain it.',
    can: [
      'CVSS 3.1 and 4.0',
      'Decode and validate vectors',
      'Metric explanations',
      'Rough 3.1 to 4.0 conversion'
    ]
  },
  {
    id: 'epss',
    path: '/epss',
    name: 'EPSS',
    title: 'EPSS lookup',
    lede: "Check how likely a CVE is to be exploited in the next 30 days, according to FIRST's daily EPSS model.",
    can: [
      'Probability and percentile',
      'Up to 100 CVEs at once',
      '30-day history',
      'How to read the numbers'
    ]
  },
  {
    id: 'kev',
    path: '/kev',
    name: 'KEV',
    title: 'KEV checker',
    lede: "Check whether a CVE is in CISA's Known Exploited Vulnerabilities catalogue, or browse and search the whole thing.",
    can: [
      'Check one or many CVEs',
      'Search and filter the catalogue',
      'Due dates and actions',
      'Ransomware use'
    ]
  },
  {
    id: 'versions',
    path: '/versions',
    name: 'Versions',
    title: 'Affected versions builder',
    lede: 'Build the affected and patched version fields for a GitHub security advisory, and test real versions against them.',
    can: [
      'Guided range builder',
      'Per-ecosystem version rules',
      'Test a version',
      'GitHub and OSV output'
    ]
  },
  {
    id: 'package',
    path: '/package',
    name: 'Package',
    title: 'Package lookup',
    lede: 'Find a package across npm, PyPI, Maven, crates.io and more, check its name, and get its versions, repo and Package URL.',
    can: [
      'Names, URLs and PURLs',
      'Search every ecosystem',
      'Versions and dates',
      'Generate a PURL'
    ]
  },
  {
    id: 'cna',
    path: '/cna',
    name: 'CNA',
    title: 'CNA directory',
    lede: 'Find which CVE Numbering Authority covers a product, how to contact them, and how to ask for a CVE.',
    can: [
      'Search by org or product',
      'Scope and contacts',
      'Disclosure policies',
      'How to get a CVE'
    ]
  }
];

export const tool = (id: ToolId) => tools.find((entry) => entry.id === id)!;
