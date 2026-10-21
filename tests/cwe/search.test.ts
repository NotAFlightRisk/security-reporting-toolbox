import { describe, expect, it } from 'vitest';
import { noFilters, passes, search } from '#lib/cwe/search.ts';
import { cweIndex } from '#lib/server/cwe.ts';

const index = cweIndex();
const top = (query: string) => search(index, query)[0]?.id;

describe('CWE search', () => {
  it.each([
    ['CWE-79', 79],
    ['cwe79', 79],
    ['79', 79],
    ['CWE 89', 89],
    ['CWE‑79', 79],
    ['  cwe-022 ', 22]
  ])('takes %j as an ID', (query, id) => {
    expect(search(index, query).map((entry) => entry.id)).toEqual([id]);
  });

  it.each([
    ['XSS', 79],
    ['cross-site scripting', 79],
    ['SQLi', 89],
    ['sql injection', 89],
    ['SSRF', 918],
    ['IDOR', 639],
    ['path traversal', 22],
    ['XXE', 611],
    ['CSRF', 352],
    ['use after free', 416],
    ['missing authorization', 862],
    ['deserialization of untrusted data', 502]
  ])('puts the obvious entry first for %j', (query, id) => {
    expect(top(query)).toBe(id);
  });

  it('ranks name matches above description-only matches', () => {
    const results = search(index, 'open redirect').map((entry) => entry.id);
    expect(results[0]).toBe(601);
  });

  it('sinks deprecated entries below live ones', () => {
    const results = search(index, 'uninitialized resource');
    const firstRetired = results.findIndex((entry) => entry.status === 'Deprecated');
    const lastLive = results.findLastIndex((entry) => entry.status !== 'Deprecated');
    expect(results.find((entry) => entry.id === 1187)).toBeDefined();
    expect(firstRetired).toBeGreaterThan(results.findIndex((entry) => entry.id === 908));
    expect(lastLive).toBeGreaterThan(-1);
  });

  it.each(['', '   ', '---', 'CWE-99999', 'zzqx flarnbit'])('finds nothing for %j', (query) => {
    expect(search(index, query)).toEqual([]);
  });

  it('filters by abstraction, usage and status', () => {
    const xss = index.find((entry) => entry.id === 79)!;
    const retired = index.find((entry) => entry.id === 1187)!;
    expect(passes(xss, noFilters)).toBe(true);
    expect(passes(xss, { ...noFilters, kind: 'Class' })).toBe(false);
    expect(passes(xss, { ...noFilters, usage: 'Prohibited' })).toBe(false);
    expect(passes(retired, noFilters)).toBe(false);
    expect(passes(retired, { ...noFilters, hideRetired: false })).toBe(true);
  });
});
