import { describe, expect, it } from 'vitest';
import { percent } from '#lib/format.ts';

describe('percent', () => {
  it.each([
    [0.97482, 2, '97.48%'],
    [0.99999, 2, '99.99%'],
    [0.9998, 1, '99.9%'],
    [1, 2, '100.00%'],
    [0, 1, '0.0%']
  ])('shows %f to %i places as %s', (value, digits, expected) => {
    expect(percent(value, digits)).toBe(expected);
  });
});
