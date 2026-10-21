import type { Ecosystem } from '#lib/ecosystems.ts';
import { schemes, type Scheme } from '#lib/versions/schemes.ts';

/** from introduced ('' = the dawn of time) to a fix, a last bad version, forever, or one version */
export interface Range {
  introduced: string;
  end: 'fixed' | 'last' | 'open' | 'exact';
  version: string;
}

export interface Problem {
  /** which range it's about, or -1 for the whole set */
  range: number;
  level: 'error' | 'warning';
  message: string;
}

export const schemeOf = (ecosystem: Ecosystem): Scheme => schemes[ecosystem.scheme];

/** GitHub's "Affected versions" field, one string per range */
export function githubAffected(range: Range) {
  if (range.end === 'exact') return `= ${range.version}`;
  const lower = range.introduced ? `>= ${range.introduced}` : '';
  const upper =
    range.end === 'fixed'
      ? `< ${range.version}`
      : range.end === 'last'
        ? `<= ${range.version}`
        : '';
  if (lower && upper) return `${lower}, ${upper}`;
  return lower || upper || '>= 0';
}

/** GitHub's "Patched versions" field, only known when the range ends in a fix */
export const githubPatched = (range: Range) => (range.end === 'fixed' ? range.version : '');

export function describe(range: Range) {
  if (range.end === 'exact') return `Only ${range.version} is affected.`;
  const from = range.introduced ? `from ${range.introduced} ` : '';
  if (range.end === 'open') {
    return range.introduced
      ? `Every version from ${range.introduced} onwards is affected, with no fix yet.`
      : 'Every version is affected, with no fix yet.';
  }
  if (range.end === 'last') {
    return range.introduced
      ? `Versions ${from}up to and including ${range.version} are affected.`
      : `Every version up to and including ${range.version} is affected.`;
  }
  return range.introduced
    ? `Versions ${from}up to, but not including, ${range.version} are affected. ${range.version} has the fix.`
    : `Every version before ${range.version} is affected. ${range.version} has the fix.`;
}

const osvRangeType = (ecosystem: Ecosystem) =>
  ecosystem.id === 'go' || ecosystem.id === 'rust' ? 'SEMVER' : 'ECOSYSTEM';

/** the OSV schema's affected[] entry for these ranges */
export function osvAffected(ecosystem: Ecosystem, name: string, ranges: Range[]) {
  const spans = ranges.filter((range) => range.end !== 'exact');
  const exact = ranges.flatMap((range) => (range.end === 'exact' ? [range.version] : []));
  return {
    package: { ecosystem: ecosystem.osv, name: name || '<package name>' },
    ...(spans.length && {
      ranges: spans.map((range) => ({
        type: osvRangeType(ecosystem),
        events: [
          { introduced: range.introduced || '0' },
          ...(range.end === 'fixed' ? [{ fixed: range.version }] : []),
          ...(range.end === 'last' ? [{ last_affected: range.version }] : [])
        ]
      }))
    }),
    ...(exact.length && { versions: exact })
  };
}

const operatorPattern = /^\s*(>=|<=|>|<|=)\s*(\S+?)\s*$/;

/** reads a GitHub range string back in, forgiving sloppy spacing and a leading v */
export function parseGithub(text: string): { range: Range } | { error: string } {
  const parts = text.split(',').map((part) => part.match(operatorPattern));
  if (!parts.length || parts.length > 2 || parts.some((part) => !part)) {
    return {
      error: `"${text.trim()}" isn't a range GitHub reads. Use one or two bounds like ">= 1.0.0, < 1.2.3".`
    };
  }
  const bounds = parts.map((part) => ({
    op: part![1],
    version: part![2].replace(/^v(?=\d)/i, '')
  }));
  const [first, second] = bounds;
  if (first.op === '=') {
    return second
      ? { error: '"=" stands on its own, it can\'t be combined with another bound.' }
      : { range: { introduced: '', end: 'exact', version: first.version } };
  }
  if (first.op === '>' && first.version !== '0') {
    return {
      error: `"> ${first.version}" can't be turned into OSV, and the GitHub database only allows ">" as "> 0". Use ">=" with the first affected version.`
    };
  }
  const isLower = (op: string) => op.startsWith('>');
  if (second && (!isLower(first.op) || isLower(second.op))) {
    return { error: 'Put the lower bound (>= or >) first and the upper bound (< or <=) second.' };
  }
  const lower = isLower(first.op) ? first : undefined;
  const upper = isLower(first.op) ? second : first;
  const introduced = lower && lower.version !== '0' ? lower.version : '';
  if (!upper) return { range: { introduced, end: 'open', version: '' } };
  return {
    range: { introduced, end: upper.op === '<' ? 'fixed' : 'last', version: upper.version }
  };
}

/** a row nobody has typed in yet, which validation and output skip */
export const isBlank = (range: Range) =>
  range.end !== 'open' && !range.introduced.trim() && !range.version.trim();

const versionsIn = (range: Range) =>
  range.end === 'exact'
    ? [range.version]
    : [range.introduced, range.end === 'open' ? '' : range.version].filter(Boolean);

/** true when version falls inside the range, using the ecosystem's own ordering */
export function inRange(range: Range, version: string, scheme: Scheme) {
  if (range.end === 'exact') return scheme.compare(version, range.version) === 0;
  if (range.introduced && scheme.compare(version, range.introduced) < 0) return false;
  if (range.end === 'fixed') return scheme.compare(version, range.version) < 0;
  if (range.end === 'last') return scheme.compare(version, range.version) <= 0;
  return true;
}

/** index of the first range a version falls in, or -1 */
export const matching = (ranges: Range[], version: string, scheme: Scheme) =>
  ranges.findIndex((range) => inRange(range, version, scheme));

// the lowest and highest versions a range covers, '' meaning unbounded
const edges = (range: Range) =>
  range.end === 'exact'
    ? [range.version, range.version]
    : [range.introduced, range.end === 'open' ? '' : range.version];

function overlaps(a: Range, b: Range, scheme: Scheme) {
  const [aLow, aHigh] = edges(a);
  const [bLow, bHigh] = edges(b);
  const below = (high: string, low: string, range: Range) => {
    if (!high || !low) return false;
    const order = scheme.compare(high, low);
    const exclusive = range.end === 'fixed';
    return exclusive ? order <= 0 : order < 0;
  };
  return !below(aHigh, bLow, a) && !below(bHigh, aLow, b);
}

export function validate(ranges: Range[], scheme: Scheme): Problem[] {
  const problems: Problem[] = [];
  const add = (range: number, level: Problem['level'], message: string) =>
    problems.push({ range, level, message });

  ranges.forEach((range, index) => {
    if (isBlank(range)) return;
    for (const version of versionsIn(range)) {
      if (!/^\d/.test(version))
        add(index, 'error', `"${version}" has to start with a number for GitHub.`);
      else if (!scheme.clean(version)) {
        add(
          index,
          'error',
          `"${version}" isn't a valid ${scheme.name} version (try ${scheme.example}).`
        );
      }
    }
    if (range.end !== 'open' && !range.version.trim()) {
      const missing = { fixed: 'fixed', last: 'last affected', exact: 'affected' }[range.end];
      add(index, 'error', `Fill in the ${missing} version, or pick "no fix yet".`);
    }
    const valid = versionsIn(range).every((version) => scheme.clean(version));
    if (
      range.introduced &&
      range.version &&
      (range.end === 'fixed' || range.end === 'last') &&
      valid
    ) {
      const order = scheme.compare(range.introduced, range.version);
      if (range.end === 'fixed' && order >= 0) {
        add(
          index,
          'error',
          `The fix (${range.version}) has to come after ${range.introduced}, or nothing is affected.`
        );
      }
      if (range.end === 'last' && order > 0) {
        add(
          index,
          'error',
          `${range.version} comes before ${range.introduced}, so the range is backwards.`
        );
      }
    }
  });

  ranges.forEach((range, index) => {
    for (let other = index + 1; other < ranges.length; other++) {
      if (isBlank(range) || isBlank(ranges[other])) continue;
      const clean = [range, ranges[other]]
        .flatMap(versionsIn)
        .every((version) => scheme.clean(version));
      if (clean && overlaps(range, ranges[other], scheme)) {
        add(other, 'warning', `Overlaps range ${index + 1}, so some versions are listed twice.`);
      }
    }
  });
  return problems;
}

/** ranges as a compact URL value: "1.0.0,1.2.3;,2.0.0;=3.1.0;2.5.0,=2.6.1;4.0.0," */
export function encodeRanges(ranges: Range[]) {
  return ranges
    .map((range) => {
      if (range.end === 'exact') return `=${range.version}`;
      const end =
        range.end === 'fixed' ? range.version : range.end === 'last' ? `=${range.version}` : '';
      return `${range.introduced},${end}`;
    })
    .join(';');
}

export function decodeRanges(value: string): Range[] {
  return value
    .split(';')
    .filter(Boolean)
    .map((part): Range => {
      if (!part.includes(','))
        return { introduced: '', end: 'exact', version: part.replace(/^=/, '') };
      const [introduced, end = ''] = part.split(',');
      if (!end) return { introduced, end: 'open', version: '' };
      return end.startsWith('=')
        ? { introduced, end: 'last', version: end.slice(1) }
        : { introduced, end: 'fixed', version: end };
    });
}
