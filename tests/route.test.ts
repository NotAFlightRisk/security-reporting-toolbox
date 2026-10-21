import { describe, expect, it } from 'vitest';
import { route } from '#lib/route.ts';

describe('route', () => {
  it.each([
    ['CVE-2021-44228', '/cve?id=CVE-2021-44228'],
    ['  cve 2021 44228 ', '/cve?id=CVE-2021-44228'],
    ['CVE‑2021‑44228', '/cve?id=CVE-2021-44228'],
    ['https://nvd.nist.gov/vuln/detail/CVE-2024-3094', '/cve?id=CVE-2024-3094'],
    ['GHSA-JFH8-C2JP-5V3Q', '/cve?id=GHSA-jfh8-c2jp-5v3q'],
    ['https://github.com/advisories/GHSA-jfh8-c2jp-5v3q', '/cve?id=GHSA-jfh8-c2jp-5v3q'],
    ['CWE-79', '/cwe/79'],
    ['cwe79', '/cwe/79'],
    ['https://cwe.mitre.org/data/definitions/918.html', '/cwe/918'],
    [
      'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      '/cvss?vector=CVSS%3A3.1%2FAV%3AN%2FAC%3AL%2FPR%3AN%2FUI%3AN%2FS%3AU%2FC%3AH%2FI%3AH%2FA%3AH'
    ],
    ['AV:N/AC:L/Au:N/C:P/I:P/A:P', '/cvss?vector=AV%3AN%2FAC%3AL%2FAu%3AN%2FC%3AP%2FI%3AP%2FA%3AP'],
    ['pkg:npm/%40babel/core@7.0.0', '/package?q=pkg%3Anpm%2F%2540babel%2Fcore%407.0.0'],
    [
      'https://pypi.org/project/requests/',
      '/package?q=https%3A%2F%2Fpypi.org%2Fproject%2Frequests%2F'
    ]
  ])('sends %j straight to %s', (input, href) => {
    expect(route(input)).toEqual({ href });
  });

  it('offers batch tools when several CVEs are pasted', () => {
    const routed = route('CVE-2021-44228, cve-2023-4863 and CVE-2021-44228 again');
    expect(routed && 'choices' in routed && routed.choices.map((choice) => choice.href)).toEqual([
      '/epss?cve=CVE-2021-44228,CVE-2023-4863',
      '/kev?cve=CVE-2021-44228,CVE-2023-4863',
      '/cve?id=CVE-2021-44228'
    ]);
  });

  it.each(['log4j', 'sql injection', '79'])('asks rather than guesses for %j', (input) => {
    const routed = route(input);
    expect(routed && 'choices' in routed && routed.choices).toHaveLength(4);
  });

  it.each(['', '   ', '​'])('ignores empty input %j', (input) => {
    expect(route(input)).toBeNull();
  });
});
