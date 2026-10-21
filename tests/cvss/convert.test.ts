import { describe, expect, it } from 'vitest';
import { to31, to40 } from '#lib/cvss/convert.ts';
import { parseVector, toVector } from '#lib/cvss/parse.ts';

const convert40 = (vector: string) => to40(parseVector(vector).values);
const convert31 = (vector: string) => to31(parseVector(vector).values);

describe('3.1 to 4.0', () => {
  it('maps a plain network RCE and still flags AT', () => {
    const { values, checks } = convert40('CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H');
    expect(toVector('4.0', values)).toBe(
      'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N'
    );
    expect(checks).toHaveLength(1);
    expect(checks[0]).toMatch(/AT/);
  });

  it('flags every judgement call on a stored XSS', () => {
    const { values, checks } = convert40('CVSS:3.1/AV:N/AC:L/PR:L/UI:R/S:C/C:L/I:L/A:N');
    expect(values).toMatchObject({ UI: 'P', SC: 'L', SI: 'L', SA: 'N' });
    expect(checks.join(' ')).toMatch(/Passive/);
    expect(checks.join(' ')).toMatch(/Scope changed/);
  });

  it('explains what AC:H turns into', () => {
    const { checks } = convert40('CVSS:3.1/AV:N/AC:H/PR:N/UI:N/S:U/C:H/I:H/A:H');
    expect(checks[0]).toMatch(/AT:P/);
  });

  it('carries exploit maturity across but says what it means now', () => {
    const { values, checks } = convert40(
      'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H/E:F/RL:O/RC:C'
    );
    expect(values.E).toBe('P');
    expect(checks.join(' ')).toMatch(/attacks/);
    expect(checks.join(' ')).toMatch(/Remediation Level/);
  });
});

describe('4.0 to 3.1', () => {
  it('turns subsequent system impact into a scope change', () => {
    const { values, checks } = convert31(
      'CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:A/VC:N/VI:N/VA:N/SC:L/SI:L/SA:N'
    );
    expect(toVector('3.1', values)).toBe('CVSS:3.1/AV:N/AC:L/PR:N/UI:R/S:C/C:L/I:L/A:N');
    expect(checks.join(' ')).toMatch(/Scope: Changed/);
  });

  it('folds attack requirements into attack complexity', () => {
    const { values } = convert31('CVSS:4.0/AV:N/AC:L/AT:P/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N');
    expect(values).toMatchObject({ AC: 'H', S: 'U', C: 'H' });
  });
});
