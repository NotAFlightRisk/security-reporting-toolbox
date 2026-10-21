import { isUnset, metricsFor, type Metric, type Version } from '#lib/cvss/metrics.ts';

export interface Parsed {
  version: Version;
  /** metric key to value key, in canonical case, unset metrics left out */
  values: Record<string, string>;
  /** assumptions we made, worth telling the user about */
  notes: string[];
  /** things that are plain wrong and need fixing */
  errors: string[];
  /** base metrics with no value yet */
  missing: Metric[];
}

const versions: Version[] = ['2.0', '3.0', '3.1', '4.0'];
const v4Only = ['AT', 'VC', 'VI', 'VA', 'SC', 'SI', 'SA'];

/** "N, A, L or P" */
export const either = (items: string[]) =>
  items.length > 1 ? `${items.slice(0, -1).join(', ')} or ${items.at(-1)}` : (items[0] ?? '');

const find = <T extends { key: string }>(items: T[], key: string) =>
  items.find((item) => item.key.toLowerCase() === key.toLowerCase());

function guessVersion(pairs: string[], notes: string[]): Version {
  const keys = pairs.map((pair) => pair.split(':')[0].toUpperCase());
  const v4 = keys.some((key) => v4Only.includes(key));
  if (!v4 && keys.includes('AU')) {
    notes.push('No version prefix, but it has Au (Authentication), so this is a CVSS 2.0 vector.');
    return '2.0';
  }
  if (v4) {
    notes.push('No version prefix, so we assumed CVSS 4.0. Start it with CVSS:4.0/ to be sure.');
    return '4.0';
  }
  notes.push(
    'No version prefix, so we assumed CVSS 3.1. Start it with CVSS:3.1/ to be sure, as 3.0 can score slightly differently.'
  );
  return '3.1';
}

/** reads a vector string, forgiving about case, spacing and brackets but never guessing values */
export function parseVector(input: string): Parsed {
  const notes: string[] = [];
  const errors: string[] = [];
  let text = input
    .normalize('NFKC')
    .replace(/\s+/g, '')
    .replace(/^\((.*)\)$/, '$1')
    .replace(/\/+$/, '');

  let version: Version | undefined;
  const prefix = text.match(/^CVSS:([^/]*)\/?/i);
  if (prefix) {
    text = text.slice(prefix[0].length);
    version = versions.find((known) => known === prefix[1]);
    if (!version) {
      return {
        version: '3.1',
        values: {},
        notes,
        errors: [`CVSS:${prefix[1]} isn't a CVSS version. Use CVSS:3.1/ or CVSS:4.0/.`],
        missing: []
      };
    }
    if (version === '2.0')
      notes.push('CVSS 2.0 vectors normally have no prefix, so we dropped it.');
  }

  const pairs = text.split('/').filter(Boolean);
  version ??= guessVersion(pairs, notes);
  const metrics = metricsFor[version];
  const values: Record<string, string> = {};
  const seen = new Set<string>();

  for (const pair of pairs) {
    const [rawKey, rawValue, ...rest] = pair.split(':');
    if (!rawKey || !rawValue || rest.length) {
      errors.push(`"${pair}" isn't a metric:value pair, like AV:N.`);
      continue;
    }
    const metric = find(metrics, rawKey);
    if (!metric) {
      const elsewhere = versions.filter(
        (other) => other !== version && find(metricsFor[other], rawKey)
      );
      const hint = elsewhere.length ? ` It's a CVSS ${either(elsewhere)} metric.` : '';
      errors.push(`${rawKey} isn't a CVSS ${version} metric.${hint}`);
      continue;
    }
    if (seen.has(metric.key)) {
      errors.push(`${metric.key} appears more than once. Keep one.`);
      continue;
    }
    seen.add(metric.key);
    const value = find(metric.values, rawValue);
    if (!value) {
      const allowed = either(
        metric.values.filter((option) => !isUnset(option.key)).map((option) => option.key)
      );
      errors.push(`${metric.key}:${rawValue} isn't a valid ${metric.name}, use ${allowed}.`);
      continue;
    }
    if (!isUnset(value.key)) values[metric.key] = value.key;
  }

  const missing = metrics.filter((metric) => metric.group === 'base' && !values[metric.key]);
  return { version, values, notes, errors, missing };
}

/** the vector in the spec's own metric order, leaving out anything not set */
export function toVector(version: Version, values: Record<string, string>) {
  const parts = metricsFor[version]
    .filter((metric) => !isUnset(values[metric.key]))
    .map((metric) => `${metric.key}:${values[metric.key]}`);
  return version === '2.0' ? parts.join('/') : [`CVSS:${version}`, ...parts].join('/');
}
