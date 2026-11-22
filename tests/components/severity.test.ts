import { describe, expect, it } from 'vitest';
import { rating } from '#lib/components/Severity.svelte';

describe('rating', () => {
  it.each([
    [0, 'None'],
    [3.9, 'Low'],
    [6.9, 'Medium'],
    [8.9, 'High'],
    [10, 'Critical']
  ])('calls %d %s in 3.x and 4.0', (score, expected) => {
    expect(rating(score, '3.1')).toBe(expected);
    expect(rating(score)).toBe(expected);
  });

  it.each([
    [0, 'Low'],
    [3.9, 'Low'],
    [4, 'Medium'],
    [7, 'High'],
    [10, 'High']
  ])('calls %d %s in 2.0, which has no Critical', (score, expected) => {
    expect(rating(score, '2.0')).toBe(expected);
  });
});
