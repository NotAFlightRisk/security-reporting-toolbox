import * as calculator from 'ae-cvss-calculator';
import { groupNames, metricsFor, type Group, type Version } from '#lib/cvss/metrics.ts';
import { toVector } from '#lib/cvss/parse.ts';

// it's a UMD bundle, so Node hands us the classes on default while Vite spreads them
const lib = ((calculator as { default?: typeof calculator }).default ??
  calculator) as typeof calculator;

const classes = { '2.0': lib.Cvss2, '3.0': lib.Cvss3P0, '3.1': lib.Cvss3P1, '4.0': lib.Cvss4P0 };

export interface Scores {
  /** the score to quote, including whatever optional metrics are set */
  overall: number;
  /** what the overall score is called, e.g. "CVSS-BT" or "Temporal" */
  label: string;
  /** every score worth showing, base first */
  parts: { name: string; score: number }[];
}

const used = (version: Version, values: Record<string, string>, group: Group) =>
  metricsFor[version].some((metric) => metric.group === group && values[metric.key]);

/** 4.0 names its score after the groups that went into it */
function nomenclature(values: Record<string, string>) {
  const threat = used('4.0', values, 'threat') ? 'T' : '';
  const environmental = used('4.0', values, 'environmental') ? 'E' : '';
  return `CVSS-B${threat}${environmental}`;
}

// a hair of slack so 8.265 rounds to 8.3 like the spec's working, not 8.2 like float maths
const round1 = (value: number) => Math.round(value * 10 + 1e-6) / 10;

/** 2.0 temporal and environmental, rounding each step like the spec does */
function rescore2(vector: InstanceType<typeof lib.Cvss2>, base: number) {
  const weight = (key: string) =>
    (vector.getComponentByString(key) as unknown as { value: number }).value;
  const temporalOf = (score: number) => round1(score * weight('E') * weight('RL') * weight('RC'));
  const kept = ['C', 'I', 'A'].reduce(
    (left, key) => left * (1 - weight(key) * weight(`${key}R`)),
    1
  );
  const impact = Math.min(10, 10.41 * (1 - kept));
  const exploitability = 20 * weight('AV') * weight('AC') * weight('Au');
  const adjusted = temporalOf(
    round1((0.6 * impact + 0.4 * exploitability - 1.5) * (impact ? 1.176 : 0))
  );
  const environmental = round1((adjusted + (10 - adjusted) * weight('CDP')) * weight('TD'));
  return { temporal: temporalOf(base), environmental: Math.max(0, environmental) };
}

/** null until every base metric has a value */
export function score(version: Version, values: Record<string, string>): Scores | null {
  const complete = metricsFor[version].every(
    (metric) => metric.group !== 'base' || values[metric.key]
  );
  if (!complete) return null;

  const vector = new classes[version](toVector(version, values));
  const result = vector.calculateScores() as unknown as Record<string, number | undefined>;
  const top = (['environmental', 'temporal'] as const).find((group) =>
    used(version, values, group)
  );
  if (vector instanceof lib.Cvss2) {
    Object.assign(result, rescore2(vector, result.base ?? 0));
    result.overall = top ? result[top] : result.base;
  }
  const overall = result.overall ?? 0;

  if (version === '4.0') {
    const label = nomenclature(values);
    const parts = [{ name: 'CVSS-B', score: result.baseMetricsOnly ?? overall }];
    if (label !== 'CVSS-B') parts.push({ name: label, score: overall });
    return { overall, label, parts };
  }

  const parts = [
    { name: 'Base', score: result.base ?? 0 },
    { name: 'Impact', score: result.impact ?? 0 },
    { name: 'Exploitability', score: result.exploitability ?? 0 }
  ];
  for (const group of ['temporal', 'environmental'] as const) {
    const value = result[group];
    if (used(version, values, group) && value !== undefined) {
      parts.push({ name: groupNames[group], score: value });
    }
  }
  return { overall, label: top ? groupNames[top] : 'Base', parts };
}
