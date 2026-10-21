import { afterEach, describe, expect, it, vi } from 'vitest';
import { batches, lookupEpss, parseEpss } from '#lib/sources/epss.ts';
import { filterKev, parseKev, parseNotes } from '#lib/sources/kev.ts';
import { fakeFetch, fixture } from './helpers.ts';

afterEach(() => vi.unstubAllGlobals());

describe('EPSS', () => {
  it('turns the string numbers into numbers', () => {
    const [webp, log4j] = parseEpss(fixture('epss-batch'))!;
    expect(webp).toMatchObject({ cve: 'CVE-2023-4863', probability: 0.99979, percentile: 0.99981 });
    expect(log4j.date).toBe('2026-10-21');
    expect(log4j.history).toEqual([]);
  });

  it('sorts the history oldest first with today on the end, once', () => {
    const [score] = parseEpss(fixture('epss-series'))!;
    const dates = score.history.map((point) => point.date);
    expect(dates.at(-1)).toBe('2026-10-21');
    expect(new Set(dates).size).toBe(dates.length);
    expect([...dates].sort()).toEqual(dates);
  });

  it('skips rows with junk numbers', () => {
    const data = [{ cve: 'CVE-2024-1', epss: 'abc', percentile: '0.5', date: '2026-10-21' }];
    expect(parseEpss({ data })).toEqual([]);
  });

  it.each([
    [0, []],
    [100, [100]],
    [250, [100, 100, 50]]
  ])('splits %i CVEs into batches of %j', (size, expected) => {
    expect(batches(Array.from({ length: size }, (_, index) => index)).map((b) => b.length)).toEqual(
      expected
    );
  });

  it('merges batches and leaves unknown CVEs out', async () => {
    const cves = Array.from({ length: 150 }, (_, index) => `CVE-2024-${10000 + index}`);
    const fetch = fakeFetch([[/epss\?cve=/, 200, fixture('epss-batch')]]);
    const outcome = await lookupEpss(cves);
    expect(fetch).toHaveBeenCalledTimes(2);
    expect(outcome.status === 'ok' && [...outcome.data.keys()]).toEqual([
      'CVE-2023-4863',
      'CVE-2021-44228'
    ]);
  });

  it('fails the lot when a batch fails, rather than claiming no score', async () => {
    fakeFetch([[/epss\?cve=CVE-2025/, 500, {}]]);
    expect(await lookupEpss(['CVE-2025-0001'])).toMatchObject({ status: 'failed' });
  });
});

describe('KEV', () => {
  const catalogue = parseKev(fixture('kev'))!;

  it('reads the catalogue newest first', () => {
    expect(catalogue.version).toBe('2026.10.20');
    expect(catalogue.entries[0].added >= catalogue.entries.at(-1)!.added).toBe(true);
  });

  it('reads ransomware use, CWEs and labelled notes', () => {
    const log4j = catalogue.byCve.get('CVE-2021-44228')!;
    expect(log4j).toMatchObject({ ransomware: true, cwes: [20, 400, 502], due: '2021-12-24' });
    expect(catalogue.byCve.get('CVE-2023-4863')!.ransomware).toBe(false);
  });

  it.each([
    [
      'https://a.example/x ; ; BOD 26-04: https://cisa.gov/b',
      [
        { label: '', url: 'https://a.example/x' },
        { label: 'BOD 26-04', url: 'https://cisa.gov/b' }
      ]
    ],
    ['', []],
    ['see vendor advisory', []]
  ])('pulls links out of notes %j', (notes, expected) => {
    expect(parseNotes(notes)).toEqual(expected);
  });

  it('drops entries without a usable CVE ID', () => {
    const parsed = parseKev({
      vulnerabilities: [{ cveID: 'nonsense' }, { cveID: 'cve-2024-1234' }]
    })!;
    expect(parsed.entries.map((entry) => entry.cve)).toEqual(['CVE-2024-1234']);
  });

  it.each([
    [{ text: 'apache log4j2' }, ['CVE-2021-44228']],
    [{ ransomware: true }, ['CVE-2021-44228']],
    [{ text: 'webp', days: 30 }, []],
    [{ text: 'webp' }, ['CVE-2023-4863']],
    [{ days: 30 }, ['CVE-2026-106931', 'CVE-2026-96656', 'CVE-2026-96655']]
  ])('filters with %j', (filter, expected) => {
    const ids = filterKev(catalogue.entries, filter, new Date('2026-10-21T12:00:00Z')).map(
      (entry) => entry.cve
    );
    expect(ids).toEqual(expected);
  });
});
