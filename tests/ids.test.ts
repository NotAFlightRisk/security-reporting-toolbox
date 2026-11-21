import { describe, expect, it } from 'vitest';
import { brokenCve, osvId } from '#lib/ids.ts';

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

describe('brokenCve', () => {
  it.each(['CVE-2021-123', 'cve 2021', 'CVE-21-44228'])('flags %j', (input) => {
    expect(brokenCve(input)).toBe(true);
  });

  it.each(['CVE-2021-44228', 'log4j jndi', 'cvent booking'])('leaves %j alone', (input) => {
    expect(brokenCve(input)).toBe(false);
  });
});
