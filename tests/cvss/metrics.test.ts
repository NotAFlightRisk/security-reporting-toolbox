import * as calculator from 'ae-cvss-calculator';
import { describe, expect, it } from 'vitest';
import { isUnset, metricsFor, type Version } from '#lib/cvss/metrics.ts';

const lib = ((calculator as { default?: typeof calculator }).default ??
  calculator) as typeof calculator;
const instances: Record<
  Version,
  {
    getRegisteredComponents(): Map<
      unknown,
      { shortName: string; values: { shortName: string }[] }[]
    >;
  }
> = {
  '2.0': new lib.Cvss2(),
  '3.0': new lib.Cvss3P0(),
  '3.1': new lib.Cvss3P1(),
  '4.0': new lib.Cvss4P0()
};

// the library lists Not Defined on base metrics too, which a vector can't use
const keysOf = (pairs: [string, string[]][]) =>
  Object.fromEntries(
    pairs.map(([key, values]) => [key, values.filter((value) => !isUnset(value)).sort()])
  );

// our metric list drives the UI and the parser, so it must agree with the scorer
describe.each(Object.keys(instances) as Version[])('CVSS %s metric list', (version) => {
  it('has the same metrics and values as the scoring library', () => {
    const theirs = [...instances[version].getRegisteredComponents().values()]
      .flat()
      .map((component) => {
        const values = component.values.map((value) => value.shortName);
        // the library takes Safety on base SC/SI/SA too, the 4.0 spec only allows it on MSI/MSA
        const lenient = version === '4.0' && ['SC', 'SI', 'SA'].includes(component.shortName);
        return [component.shortName, lenient ? values.filter((value) => value !== 'S') : values];
      }) as [string, string[]][];
    const ours = metricsFor[version].map(
      (metric) => [metric.key, metric.values.map((value) => value.key)] as [string, string[]]
    );
    expect(keysOf(ours)).toEqual(keysOf(theirs));
  });
});
