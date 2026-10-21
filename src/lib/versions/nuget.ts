// NuGetVersion: SemVer 2 plus the old four-part versions

const pattern =
  /^(\d+(?:\.\d+){0,3})(?:-([0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*))?(?:\+[0-9A-Za-z-]+(?:\.[0-9A-Za-z-]+)*)?$/;

const parse = (version: string) => {
  const match = version.trim().match(pattern);
  if (!match) return null;
  const numbers = match[1].split('.').map(Number);
  return { numbers, labels: match[2]?.split('.') ?? [] };
};

export const validNuget = (version: string) => parse(version) !== null;

function compareLabel(a: string, b: string) {
  const [aNumeric, bNumeric] = [/^\d+$/.test(a), /^\d+$/.test(b)];
  if (aNumeric && bNumeric) return Math.sign(Number(a) - Number(b));
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
  const [x, y] = [a.toLowerCase(), b.toLowerCase()];
  return x < y ? -1 : x > y ? 1 : 0;
}

export function compareNuget(a: string, b: string) {
  const [left, right] = [parse(a), parse(b)];
  if (!left || !right) return 0;
  for (let index = 0; index < 4; index++) {
    const diff = (left.numbers[index] ?? 0) - (right.numbers[index] ?? 0);
    if (diff) return Math.sign(diff);
  }
  if (!left.labels.length || !right.labels.length) {
    return Math.sign(right.labels.length - left.labels.length);
  }
  for (let index = 0; index < Math.max(left.labels.length, right.labels.length); index++) {
    if (left.labels[index] === undefined) return -1;
    if (right.labels[index] === undefined) return 1;
    const result = compareLabel(left.labels[index], right.labels[index]);
    if (result) return result;
  }
  return 0;
}
