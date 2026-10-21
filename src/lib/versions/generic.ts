// best guess for the rest, using GitHub's rule that letters after numbers mean pre-release

const stages: Record<string, number> = {
  dev: 0,
  alpha: 1,
  a: 1,
  beta: 2,
  b: 2,
  rc: 3,
  patch: 5,
  pl: 5,
  p: 5
};
const release = 4;

const tokens = (version: string) =>
  version
    .trim()
    .replace(/^v(?=\d)/i, '')
    .toLowerCase()
    .match(/\d+|[a-z]+/g) ?? [];

const stage = (token: string | undefined) =>
  token === undefined || /^\d/.test(token) ? release : (stages[token] ?? 1.5);

export const validGeneric = (version: string) => /^v?\d[^\s,]*$/i.test(version.trim());

export function compareGeneric(a: string, b: string) {
  const [left, right] = [tokens(a), tokens(b)];
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const [l, r] = [left[index], right[index]];
    if (l === r) continue;
    const [lNumber, rNumber] = [/^\d/.test(l ?? '0'), /^\d/.test(r ?? '0')];
    if (lNumber && rNumber) return Math.sign(Number(l ?? 0) - Number(r ?? 0));
    const diff = stage(l) - stage(r);
    if (diff) return Math.sign(diff);
    return (l ?? '') < (r ?? '') ? -1 : 1;
  }
  return 0;
}
