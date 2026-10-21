// BigInt so a 17-digit timestamp in a version doesn't round into its neighbour
export const compareNumbers = (a: string | bigint, b: string | bigint) => {
  const [x, y] = [BigInt(a), BigInt(b)];
  return x < y ? -1 : x > y ? 1 : 0;
};

const numeric = (part: string) => /^\d+$/.test(part);

/** SemVer pre-release precedence: numbers by value, below words, and fewer parts sort first */
export function comparePrerelease(left: string[], right: string[], { caseless = false } = {}) {
  if (!left.length || !right.length) return Math.sign(right.length - left.length);
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const [a, b] = [left[index], right[index]];
    if (a === undefined) return -1;
    if (b === undefined) return 1;
    if (numeric(a) && numeric(b)) {
      const result = compareNumbers(a, b);
      if (result) return result;
      continue;
    }
    if (numeric(a) !== numeric(b)) return numeric(a) ? -1 : 1;
    const [x, y] = caseless ? [a.toLowerCase(), b.toLowerCase()] : [a, b];
    if (x !== y) return x < y ? -1 : 1;
  }
  return 0;
}
