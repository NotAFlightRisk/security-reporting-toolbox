import { afterEach, describe, expect, it, vi } from 'vitest';
import { Lookup } from '#lib/sources/lookup.svelte.ts';
import { fakeFetch, fixture } from './helpers.ts';

afterEach(() => vi.unstubAllGlobals());

const log4shell: [RegExp, number, unknown][] = [
  [/api\/cve\/CVE-2021-44228/, 200, fixture('cveorg-log4shell')],
  [/cveId=CVE-2021-44228/, 200, fixture('nvd-log4shell')],
  [/advisories\?cve_id=CVE-2021-44228/, 200, fixture('github-by-cve')]
];

describe('Lookup', () => {
  it('carries on with the CVE from OSV when GitHub is rate limited', async () => {
    fakeFetch([
      [/advisories\/GHSA-jfh8/, 429, {}],
      [/vulns\/GHSA-jfh8/, 200, fixture('osv-ghsa')],
      ...log4shell
    ]);
    const lookup = new Lookup('GHSA-jfh8-c2jp-5v3q');
    await lookup.run();
    await vi.waitFor(() => expect(lookup.nvd?.status).toBe('ok'));
    expect(lookup.cve).toBe('CVE-2021-44228');
    expect(lookup.record?.status).toBe('ok');
    expect(lookup.github).toMatchObject({ status: 'failed', reason: 'rate-limit' });
  });

  it('follows an OSV ID to its CVE and asks everyone about that', async () => {
    const osv = { id: 'RUSTSEC-2021-0001', aliases: ['CVE-2021-44228', 'GHSA-jfh8-c2jp-5v3q'] };
    fakeFetch([[/vulns\/RUSTSEC-2021-0001/, 200, osv], ...log4shell]);
    const lookup = new Lookup('RUSTSEC-2021-0001');
    await lookup.run();
    await vi.waitFor(() => expect(lookup.github?.status).toBe('ok'));
    expect(lookup.cve).toBe('CVE-2021-44228');
    await vi.waitFor(() => expect(lookup.nvd?.status).toBe('ok'));
  });

  it("says GitHub wasn't asked when OSV couldn't name an alias", async () => {
    fakeFetch([[/vulns\/GO-2022-0001/, 503, {}]]);
    const lookup = new Lookup('GO-2022-0001');
    await lookup.run();
    await vi.waitFor(() => expect(lookup.github?.status).toBe('failed'));
    expect(lookup.cve).toBeNull();
    expect(lookup.github).toMatchObject({ message: "wasn't asked, since OSV didn't answer" });
    expect(lookup.record).toBeUndefined();
  });
});
