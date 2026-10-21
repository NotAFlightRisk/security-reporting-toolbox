import { afterEach, describe, expect, it, vi } from 'vitest';
import { advisoriesForCve, parseAdvisory } from '#lib/sources/github.ts';
import { lookupOsv, parseOsv } from '#lib/sources/osv.ts';
import { fakeFetch, fixture } from './helpers.ts';

afterEach(() => vi.unstubAllGlobals());

describe('parseAdvisory', () => {
  it('reads packages, CWEs and drops the empty v4 slot', () => {
    const advisory = parseAdvisory(fixture('github-by-cve')[0])!;
    expect(advisory).toMatchObject({
      ghsa: 'GHSA-jfh8-c2jp-5v3q',
      cve: 'CVE-2021-44228',
      reviewed: true,
      withdrawn: null
    });
    expect(advisory.scores).toEqual([
      { version: '3.1', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H/E:H', score: 10 }
    ]);
    expect(advisory.weaknesses.map((item) => item.id)).toEqual([20, 400, 502, 917]);
    expect(advisory.packages[0]).toEqual({
      ecosystem: 'maven',
      name: 'org.apache.logging.log4j:log4j-core',
      range: '>= 2.13.0, < 2.15.0',
      patched: '2.15.0'
    });
    expect(advisory.packages.some((item) => item.patched === null)).toBe(true);
  });

  it('keeps a v4-only score that disagrees with the CNA', () => {
    const advisory = parseAdvisory(fixture('github-v4'))!;
    expect(advisory.scores).toEqual([
      {
        version: '4.0',
        vector: 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:P/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H',
        score: 9.4
      }
    ]);
  });

  it('flags a withdrawn advisory with no CVE', () => {
    expect(parseAdvisory(fixture('github-withdrawn'))).toMatchObject({
      cve: null,
      withdrawn: '2026-10-16T20:08:50Z'
    });
  });

  it.each([null, {}, { ghsa_id: '' }])('refuses %j', (input) => {
    expect(parseAdvisory(input)).toBeNull();
  });
});

describe('advisoriesForCve', () => {
  it('calls an empty list missing, not failed', async () => {
    fakeFetch([[/cve_id=CVE-2099-99999/, 200, fixture('github-empty')]]);
    expect(await advisoriesForCve('CVE-2099-99999')).toEqual({ status: 'missing' });
  });

  it('spots the unauthenticated rate limit', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(
        async () => new Response('{}', { status: 403, headers: { 'x-ratelimit-remaining': '0' } })
      )
    );
    expect(await advisoriesForCve('CVE-2021-0001')).toMatchObject({ reason: 'rate-limit' });
  });
});

describe('parseOsv', () => {
  it.each([
    ['osv-cve', 'CVE-2021-44228', ['GHSA-jfh8-c2jp-5v3q']],
    ['osv-ghsa', 'GHSA-jfh8-c2jp-5v3q', ['CVE-2021-44228']]
  ])('cross references %s', (name, id, aliases) => {
    const record = parseOsv(fixture(name))!;
    expect(record.id).toBe(id);
    expect(record.aliases).toEqual(aliases);
    expect(record.scores[0]).toMatchObject({ version: '3.1', score: null });
  });

  it("treats OSV's 404 as missing", async () => {
    fakeFetch([[/vulns\/CVE-2099-99999/, 404, { code: 5, message: 'Vulnerability not found' }]]);
    expect(await lookupOsv('CVE-2099-99999')).toEqual({ status: 'missing' });
  });
});
