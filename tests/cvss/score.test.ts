import { describe, expect, it } from 'vitest';
import { parseVector } from '#lib/cvss/parse.ts';
import { score } from '#lib/cvss/score.ts';

const scoreOf = (vector: string) => {
  const { version, values } = parseVector(vector);
  return score(version, values);
};

// worked examples from https://www.first.org/cvss/v3.1/examples
const first31 = [
  ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:L/I:L/A:N', 6.4],
  ['CVSS:3.1/AV:N/AC:H/PR:N/UI:R/S:U/C:L/I:N/A:N', 3.1],
  ['CVSS:3.1/AV:N/AC:L/PR:L/UI:N/S:C/C:H/I:H/A:H', 9.9],
  ['CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:U/C:L/I:L/A:L', 4.2],
  ['CVSS:3.1/AV:N/AC:L/PR:H/UI:N/S:U/C:H/I:H/A:H', 7.2],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 9.8],
  ['CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:C/C:N/I:H/A:N', 6.8],
  ['CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 6.8],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:L/I:N/A:N', 5.8],
  ['CVSS:3.1/AV:A/AC:L/PR:N/UI:N/S:C/C:H/I:N/A:H', 9.3],
  ['CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:U/C:N/I:H/A:N', 4.6],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:H/I:H/A:H', 9.6],
  ['CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N', 6.1],
  ['CVSS:3.1/AV:L/AC:L/PR:H/UI:N/S:C/C:H/I:H/A:H', 8.2],
  ['CVSS:3.1/AV:P/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', 7.6]
] as const;

// worked examples from https://www.first.org/cvss/v4.0/examples (summary table values)
const first40 = [
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 9.3],
  ['CVSS:4.0/AV:L/AC:L/AT:P/PR:L/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 7.3],
  ['CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:A/VC:L/VI:N/VA:N/SC:N/SI:N/SA:N', 4.6],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:A/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N', 5.1],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N', 6.9],
  ['CVSS:4.0/AV:L/AC:L/AT:N/PR:H/UI:N/VC:N/VI:N/VA:N/SC:H/SI:N/SA:N', 5.9],
  ['CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H', 9.4],
  ['CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:N/VI:L/VA:N/SC:H/SI:N/SA:H', 6.4],
  ['CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 7.0],
  ['CVSS:4.0/AV:P/AC:L/AT:P/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', 5.4],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:H/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N', 6.9],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:N/VI:L/VA:N/SC:L/SI:N/SA:H', 7.8]
] as const;

// threat, environmental and supplemental metrics, from the same page
const first40Extra = [
  ['CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:P/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/E:U', 5.2, 'CVSS-BT'],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H/E:A', 10, 'CVSS-BT'],
  ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:N/VA:N/SC:N/SI:N/SA:N/E:A', 8.7, 'CVSS-BT'],
  [
    'CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:H/VI:L/VA:L/SC:N/SI:N/SA:N/CR:H/IR:L/AR:L/MAV:N/MAC:H/MVC:H/MVI:L/MVA:L',
    8.1,
    'CVSS-BE'
  ],
  [
    'CVSS:4.0/AV:N/AC:H/AT:P/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/E:P/MAC:L/MAT:N/MVC:N/MVI:N/MVA:L',
    5.5,
    'CVSS-BTE'
  ],
  ['CVSS:4.0/AV:A/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:N/SC:N/SI:N/SA:N/MSI:S/S:P', 9.7, 'CVSS-BE'],
  ['CVSS:4.0/AV:L/AC:L/AT:N/PR:N/UI:P/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/E:U/MUI:A', 5.7, 'CVSS-BTE'],
  [
    'CVSS:4.0/AV:N/AC:L/AT:N/PR:L/UI:N/VC:H/VI:H/VA:H/SC:H/SI:H/SA:H/S:P/AU:Y/V:C/RE:L',
    9.4,
    'CVSS-B'
  ],
  ['CVSS:4.0/AV:P/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/U:Red', 7.0, 'CVSS-B']
] as const;

describe('CVSS 3.1 base scores', () => {
  it.each(first31)('%s scores %d', (vector, expected) => {
    expect(scoreOf(vector)?.overall).toBe(expected);
  });
});

describe('CVSS 4.0 base scores', () => {
  it.each(first40)('%s scores %d', (vector, expected) => {
    expect(scoreOf(vector)?.overall).toBe(expected);
  });
});

describe('CVSS 4.0 with optional metrics', () => {
  it.each(first40Extra)('%s scores %d as %s', (vector, expected, label) => {
    const result = scoreOf(vector);
    expect(result?.overall).toBe(expected);
    expect(result?.label).toBe(label);
  });
});

// temporal and environmental worked through by hand with the 3.1 spec's formulas
describe('CVSS 3.1 temporal and environmental', () => {
  it.each([
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:N/A:N/E:F/RL:O/RC:C', 7.0, 'Temporal'],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:U/RL:O/RC:R', 8.2, 'Temporal'],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/CR:L/IR:L/AR:L', 8.0, 'Environmental']
  ])('%s scores %d', (vector, expected, label) => {
    const result = scoreOf(vector);
    expect(result?.overall).toBe(expected);
    expect(result?.label).toBe(label);
    expect(result?.parts[0]).toEqual({ name: 'Base', score: expect.any(Number) });
  });
});

// examples from the CVSS 2.0 guide, https://www.first.org/cvss/v2/guide
describe('CVSS 2.0', () => {
  it.each([
    ['AV:N/AC:L/Au:N/C:N/I:N/A:C', 7.8],
    ['AV:N/AC:L/Au:N/C:N/I:N/A:C/E:F/RL:OF/RC:C', 6.4],
    ['AV:N/AC:L/Au:N/C:C/I:C/A:C', 10],
    ['AV:L/AC:H/Au:N/C:C/I:C/A:C/E:POC/RL:OF/RC:C', 4.9]
  ])('%s scores %d', (vector, expected) => {
    expect(scoreOf(vector)?.overall).toBe(expected);
  });
});

describe('versions that differ', () => {
  it('scores a 3.0 vector with 3.0 rounding', () => {
    expect(scoreOf('CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H')?.overall).toBe(9.8);
  });

  it('returns null until every base metric is set', () => {
    expect(scoreOf('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H')).toBeNull();
    expect(scoreOf('CVSS:4.0/AV:N/AC:L/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N')).toBeNull();
  });

  it('scores no impact as zero', () => {
    expect(scoreOf('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:N/I:N/A:N')?.overall).toBe(0);
  });
});
