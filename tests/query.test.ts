import { describe, expect, it } from 'vitest';
import { pageIndex } from '#lib/query.svelte.ts';

describe('pageIndex', () => {
  it.each([
    ['', Infinity, 0],
    ['3', Infinity, 3],
    ['1.5', Infinity, 1],
    ['-2', Infinity, 0],
    ['nonsense', Infinity, 0],
    ['Infinity', Infinity, 0],
    ['99', 4, 4],
    ['2', -1, 0]
  ])('reads %j with a last page of %d as %d', (value, last, expected) => {
    expect(pageIndex(value, last)).toBe(expected);
  });
});
