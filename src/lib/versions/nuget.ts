// NuGetVersion: SemVer 2 plus the old four-part versions
import { compareNumbers, comparePrerelease } from '#lib/versions/order.ts';

const pattern =
  /^(\d+(?:\.\d+){0,3})(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const parse = (version: string) => {
  const match = version.trim().match(pattern);
  if (!match) return null;
  return { numbers: match[1].split('.'), labels: match[2]?.split('.') ?? [] };
};

export const validNuget = (version: string) => parse(version) !== null;

export function compareNuget(a: string, b: string) {
  const [left, right] = [parse(a), parse(b)];
  if (!left || !right) return 0;
  for (let index = 0; index < 4; index++) {
    const result = compareNumbers(left.numbers[index] ?? 0, right.numbers[index] ?? 0);
    if (result) return result;
  }
  return comparePrerelease(left.labels, right.labels, { caseless: true });
}
