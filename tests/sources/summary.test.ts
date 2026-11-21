import { describe, expect, it } from 'vitest';
import { parseCveRecord } from '#lib/sources/cveorg.ts';
import { parseAdvisory } from '#lib/sources/github.ts';
import { parseNvdPage } from '#lib/sources/nvd.ts';
import { parseOsv } from '#lib/sources/osv.ts';
import {
  aliases,
  allReferences,
  headlineScore,
  mainWeakness,
  mergeWeaknesses
} from '#lib/sources/summary.ts';
import { fixture } from './helpers.ts';

const log4shell = {
  record: parseCveRecord(fixture('cveorg-log4shell')),
  nvd: parseNvdPage(fixture('nvd-log4shell'))!.items[0],
  advisories: [parseAdvisory(fixture('github-by-cve')[0])!],
  osv: parseOsv(fixture('osv-cve'))
};

describe('mergeWeaknesses', () => {
  it('gives one row per CWE with everyone who named it', () => {
    const merged = mergeWeaknesses(log4shell);
    expect(merged.map((item) => item.id)).toEqual([20, 400, 502, 917]);
    expect(merged.find((item) => item.id === 502)).toEqual({
      id: 502,
      text: 'Deserialization of Untrusted Data',
      sources: ['CNA', 'GitHub']
    });
    expect(merged.find((item) => item.id === 917)!.sources).toEqual(['NVD', 'GitHub']);
  });

  it('copes with nothing at all', () => {
    expect(mergeWeaknesses({ record: null, nvd: null, advisories: [], osv: null })).toEqual([]);
  });
});

describe('mainWeakness', () => {
  it('goes with the most agreed CWE, first named on a tie, not the lowest number', () => {
    expect(mainWeakness(log4shell)).toBe(502);
  });

  it("takes NVD's primary pick over a vote", () => {
    const weaknesses = log4shell.nvd.weaknesses.map((item) => ({
      ...item,
      primary: item.id === 917
    }));
    expect(mainWeakness({ ...log4shell, nvd: { ...log4shell.nvd, weaknesses } })).toBe(917);
  });

  it('has nothing to say without a numbered CWE', () => {
    expect(mainWeakness({ record: null, nvd: null, advisories: [], osv: null })).toBeNull();
  });
});

describe('aliases', () => {
  it('cross references the GHSA from a CVE and leaves out the subject', () => {
    expect(aliases('CVE-2021-44228', log4shell)).toEqual(['GHSA-jfh8-c2jp-5v3q']);
  });

  it('finds the CVE when you looked up the GHSA', () => {
    expect(aliases('GHSA-jfh8-c2jp-5v3q', log4shell)).toContain('CVE-2021-44228');
  });
});

describe('allReferences', () => {
  it('dedupes the NVD and CNA copies of the same link', () => {
    const urls = allReferences(log4shell).map((ref) => ref.url.replace(/\/$/, ''));
    expect(new Set(urls).size).toBe(urls.length);
  });
});

describe('headlineScore', () => {
  it.each([
    [
      [
        { version: '3.1', vector: 'a', score: 9.8 },
        { version: '4.0', vector: 'b', score: 9.3 }
      ],
      'b'
    ],
    [
      [
        { version: '2.0', vector: 'a', score: 7.5 },
        { version: '4.0', vector: 'b', score: null }
      ],
      'a'
    ],
    [[], null]
  ] as const)('picks the newest version with a number', (scores, vector) => {
    expect(headlineScore([...scores])?.vector ?? null).toBe(vector);
  });
});
