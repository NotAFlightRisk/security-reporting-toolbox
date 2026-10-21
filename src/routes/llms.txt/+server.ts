import { cweRelease } from '#lib/server/cwe.ts';
import { absolute, site } from '#lib/site.ts';
import { tools } from '#lib/tools.ts';

export const prerender = true;

// a plain map of the site for AI assistants, per llmstxt.org
export const GET = () => {
  const { version } = cweRelease();
  const lines = [
    `# ${site.name}`,
    '',
    `> ${site.description}`,
    '',
    'Every tool runs in the browser against the official source and links its results to the others. Tool state lives in the URL, so these links work directly:',
    '',
    '## Tools',
    '',
    ...tools.map(({ path, title, lede }) => `- [${title}](${absolute(path)}): ${lede}`),
    '',
    '## Deep links',
    '',
    `- CWE entry: ${absolute('/cwe/79')} (every CWE ${version} weakness and category has a page)`,
    `- CVE or GHSA: ${absolute('/cve?id=CVE-2021-44228')}`,
    `- CVSS vector: ${absolute('/cvss?vector=CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')}`,
    `- EPSS for several CVEs: ${absolute('/epss?cve=CVE-2021-44228,CVE-2023-4863')}`,
    `- KEV check: ${absolute('/kev?cve=CVE-2021-44228')}`,
    `- Package: ${absolute('/package?q=pkg:npm/express')}`,
    `- CNA search: ${absolute('/cna?q=wordpress')}`,
    '',
    '## More',
    '',
    `- [About and sources](${absolute('/about')})`,
    `- [Source code](${site.repo})`,
    ''
  ];
  return new Response(lines.join('\n'), {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' }
  });
};
