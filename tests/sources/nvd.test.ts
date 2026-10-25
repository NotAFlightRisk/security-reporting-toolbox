import { afterEach, describe, expect, it, vi } from 'vitest';
import { lookupNvd, parseNvdPage, searchNvd } from '#lib/sources/nvd.ts';
import { fakeFetch, fixture } from './helpers.ts';

afterEach(() => vi.unstubAllGlobals());

describe('parseNvdPage', () => {
  it('reads scores by source, weaknesses and the KEV fields', () => {
    const [cve] = parseNvdPage(fixture('nvd-log4shell'))!.items;
    expect(cve.status).toBe('Analyzed');
    expect(
      cve.scores.map(({ source, version, score, primary }) => [source, version, score, primary])
    ).toEqual([
      ['NVD', '3.1', 10, true],
      ['CISA-ADP', '3.1', 10, false],
      ['NVD', '2.0', 9.3, true]
    ]);
    expect(cve.weaknesses).toContainEqual({ id: 917, text: '', source: 'NVD' });
    expect(cve.weaknesses).toContainEqual({ id: 502, text: '', source: 'security@apache.org' });
    expect(cve.kev).toMatchObject({ added: '2021-12-10', due: '2021-12-24' });
  });

  it('skips SSVC and other metrics that have no CVSS data', () => {
    const [cve] = parseNvdPage(fixture('nvd-webp'))!.items;
    expect(cve.scores.every((score) => score.vector.startsWith('CVSS:3.1/'))).toBe(true);
  });

  it.each([
    ['nvd-keyword', 7, 3],
    ['nvd-missing', 0, 0]
  ])('counts %s', (name, total, items) => {
    const page = parseNvdPage(fixture(name))!;
    expect([page.total, page.items.length]).toEqual([total, items]);
  });

  it('keeps one copy of a CVE that NVD sends twice', () => {
    const page = fixture('nvd-keyword');
    const twice = { ...page, vulnerabilities: [...page.vulnerabilities, page.vulnerabilities[1]] };
    expect(parseNvdPage(twice)!.items.map((item) => item.id)).toEqual([
      'CVE-2021-44228',
      'CVE-2021-4104',
      'CVE-2021-45046'
    ]);
  });

  it('keeps rejected CVEs, with their status', () => {
    expect(parseNvdPage(fixture('nvd-rejected'))!.items[0].status).toBe('Rejected');
  });

  it.each([null, [], { vulnerabilities: [] }, { totalResults: '3' }])('refuses %j', (input) => {
    expect(parseNvdPage(input)).toBeNull();
  });
});

describe('lookupNvd', () => {
  it('calls an empty result missing', async () => {
    fakeFetch([[/cveId=CVE-2099-99999/, 200, fixture('nvd-missing')]]);
    expect(await lookupNvd('CVE-2099-99999')).toEqual({ status: 'missing' });
  });

  it('explains a bare 403 as the rate limit', async () => {
    fakeFetch([[/cveId=CVE-2021-0403/, 403, {}]]);
    expect(await lookupNvd('CVE-2021-0403')).toMatchObject({
      status: 'failed',
      reason: 'rate-limit'
    });
  });
});

describe('searchNvd', () => {
  it('reads the newest page off the far end and flips it', async () => {
    const page = fixture('nvd-keyword');
    const fetch = fakeFetch([
      [/resultsPerPage=1&/, 200, { ...page, totalResults: 45, vulnerabilities: [] }],
      [/resultsPerPage=20&startIndex=25/, 200, { ...page, totalResults: 45 }]
    ]);
    const outcome = await searchNvd({ keyword: 'log4j jndi' });
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(outcome).toMatchObject({ status: 'ok', data: { total: 45 } });
    if (outcome.status === 'ok') {
      expect(outcome.data.items.map((item) => item.id)).toEqual([
        'CVE-2021-45046',
        'CVE-2021-4104',
        'CVE-2021-44228'
      ]);
    }
  });

  it('asks for a short last page instead of overlapping', async () => {
    const page = fixture('nvd-keyword');
    const fetch = fakeFetch([
      [/cweId=CWE-79&resultsPerPage=1&/, 200, { ...page, totalResults: 45, vulnerabilities: [] }],
      [/cweId=CWE-79&resultsPerPage=5&startIndex=0/, 200, { ...page, totalResults: 45 }]
    ]);
    expect(await searchNvd({ cwe: 79 }, 2)).toMatchObject({ status: 'ok' });
    expect(fetch).toHaveBeenLastCalledWith(
      expect.stringContaining('resultsPerPage=5&startIndex=0'),
      expect.anything()
    );
  });

  it('passes the failure through when NVD is down', async () => {
    fakeFetch([[/keywordSearch=down/, 503, {}]]);
    expect(await searchNvd({ keyword: 'down' })).toMatchObject({
      status: 'failed',
      reason: 'server'
    });
  });
});
