import { describe, expect, it } from 'vitest';
import { parseVector, toVector } from '#lib/cvss/parse.ts';

const full31 = 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H';

describe('forgiving input', () => {
  it.each([
    ['lowercase', 'cvss:3.1/av:n/ac:l/pr:n/ui:n/s:u/c:h/i:h/a:h'],
    ['spaces and brackets', ' (CVSS:3.1 / AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H) '],
    ['trailing slash', `${full31}/`],
    ['any metric order', 'CVSS:3.1/A:H/I:H/C:H/S:U/UI:N/PR:N/AC:L/AV:N']
  ])('reads %s', (_, input) => {
    const parsed = parseVector(input);
    expect(parsed.errors).toEqual([]);
    expect(parsed.missing).toEqual([]);
    expect(toVector(parsed.version, parsed.values)).toBe(full31);
  });

  it('keeps the provider urgency colour in its own case', () => {
    const parsed = parseVector(
      'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N/U:red'
    );
    expect(parsed.values.U).toBe('Red');
  });

  it('drops metrics explicitly set to Not Defined', () => {
    const parsed = parseVector(`${full31}/E:X/RL:X`);
    expect(toVector(parsed.version, parsed.values)).toBe(full31);
  });
});

describe('versions', () => {
  it.each([
    ['AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', '3.1', /assumed CVSS 3\.1/],
    ['AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', '4.0', /assumed CVSS 4\.0/],
    ['(AV:N/AC:L/Au:N/C:P/I:P/A:P)', '2.0', /CVSS 2\.0/],
    ['CVSS:2.0/AV:N/AC:L/Au:N/C:P/I:P/A:P', '2.0', /normally have no prefix/]
  ])('works out %s is %s and says so', (input, version, note) => {
    const parsed = parseVector(input);
    expect(parsed.version).toBe(version);
    expect(parsed.errors).toEqual([]);
    expect(parsed.notes.join(' ')).toMatch(note);
  });

  it('reads a 3.0 prefix as 3.0, without notes', () => {
    const parsed = parseVector('CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H');
    expect(parsed.version).toBe('3.0');
    expect(parsed.notes).toEqual([]);
  });

  it('refuses a version that does not exist', () => {
    expect(parseVector('CVSS:3.2/AV:N').errors[0]).toMatch(/CVSS:3\.2 isn't a CVSS version/);
  });
});

describe('mistakes get named, with the fix', () => {
  it.each([
    [
      'CVSS:3.1/AV:N/AC:X/PR:N/UI:N/S:U/C:H/I:H/A:H',
      "AC:X isn't a valid Attack Complexity, use L or H."
    ],
    [
      'CVSS:3.1/AV:Q/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H',
      "AV:Q isn't a valid Attack Vector, use N, A, L or P."
    ],
    ['CVSS:3.1/AV:N/AV:L/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', 'AV appears more than once. Keep one.'],
    [
      'CVSS:3.1/AV:N/AC:L/AT:N/PR:N/UI:N/S:U/C:H/I:H/A:H',
      "AT isn't a CVSS 3.1 metric. It's a CVSS 4.0 metric."
    ],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/ZZ:Q', "ZZ isn't a CVSS 3.1 metric."],
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A', '"A" isn\'t a metric:value pair, like AV:N.'],
    [
      'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:S/SI:N/SA:N',
      "SC:S isn't a valid Confidentiality (subsequent), use H, L or N."
    ]
  ])('%s', (input, error) => {
    expect(parseVector(input).errors).toContain(error);
  });

  it('lists the base metrics still missing, without calling it an error', () => {
    const parsed = parseVector('CVSS:3.1/AV:N/AC:L/PR:N');
    expect(parsed.errors).toEqual([]);
    expect(parsed.missing.map((metric) => metric.key)).toEqual(['UI', 'S', 'C', 'I', 'A']);
    expect(parsed.values).toEqual({ AV: 'N', AC: 'L', PR: 'N' });
  });

  it('accepts Safety on modified subsequent integrity but not on confidentiality', () => {
    const base = 'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N';
    expect(parseVector(`${base}/MSI:S`).errors).toEqual([]);
    expect(parseVector(`${base}/MSC:S`).errors[0]).toMatch(/MSC:S isn't a valid/);
  });
});

describe('toVector', () => {
  it('writes metrics in the spec order with the prefix', () => {
    expect(toVector('4.0', { SA: 'N', AV: 'N', E: 'A', AC: 'L' })).toBe(
      'CVSS:4.0/AV:N/AC:L/SA:N/E:A'
    );
  });

  it('leaves the prefix off 2.0', () => {
    expect(toVector('2.0', { AV: 'N', AC: 'L' })).toBe('AV:N/AC:L');
  });
});
