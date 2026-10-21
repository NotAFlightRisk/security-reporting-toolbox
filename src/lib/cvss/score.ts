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

/** null until every base metric has a value */
export function score(version: Version, values: Record<string, string>): Scores | null {
  const complete = metricsFor[version].every(
    (metric) => metric.group !== 'base' || values[metric.key]
  );
  if (!complete) return null;

  const vector = new classes[version](toVector(version, values));
  const result = vector.calculateScores() as unknown as Record<string, number | undefined>;
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
  const top = (['environmental', 'temporal'] as const).find((group) =>
    used(version, values, group)
  );
  return { overall, label: top ? groupNames[top] : 'Base', parts };
}
