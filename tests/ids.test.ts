import { describe, expect, it } from 'vitest';
import { brokenCve, malformedCves, osvId } from '#lib/ids.ts';

describe('osvId', () => {
  it.each([
    ['RUSTSEC-2021-0001', 'RUSTSEC-2021-0001'],
    ['see pysec-2021-19 for details', 'PYSEC-2021-19'],
    ['GO-2022-0969', 'GO-2022-0969'],
    ['CVE-2021-44228', null],
    ['GOOSE-2022-1', null]
  ])('reads %j as %j', (input, id) => {
    expect(osvId(input)).toBe(id);
  });
});

describe('malformedCves', () => {
  it.each([
    ['CVE-2021-44228, cve 2023 4863', []],
    ['CVE-2021-123 and CVE-2021-44228', ['CVE-2021-123']],
    [
      'CVE-2021, CVE-20211-44228\nCVE-2021-123 CVE-2021-123',
      ['CVE-2021', 'CVE-20211-44228', 'CVE-2021-123']
    ],
    ['log4j, nothing CVE-shaped here', []]
  ])('picks the broken IDs out of %j', (text, expected) => {
    expect(malformedCves(text)).toEqual(expected);
  });
});

describe('brokenCve', () => {
  it.each(['CVE-2021-123', ' cve 2021 ', 'CVE-21-44228'])('flags %j', (input) => {
    expect(brokenCve(input)).toBe(true);
  });

  it.each(['CVE-2021-44228', 'log4j jndi', 'cvent booking', 'CVE-2021 log4j'])(
    'leaves %j alone',
    (input) => {
      expect(brokenCve(input)).toBe(false);
    }
  );
});
