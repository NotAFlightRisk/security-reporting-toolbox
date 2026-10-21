// Gem::Version, straight from RubyGems' own <=>

const pattern = /^[0-9]+(\.[0-9a-zA-Z]+)*(-[0-9A-Za-z-]+(\.[0-9A-Za-z-]+)*)?$/;

export const validGem = (version: string) => pattern.test(version.trim());

function canonical(version: string) {
  const text = version.trim().replaceAll('-', '.pre.');
  const segments = (text.match(/[0-9]+|[a-z]+/gi) ?? []).map((part) =>
    /^\d/.test(part) ? Number(part) : part
  );
  const split = segments.findIndex((part) => typeof part === 'string');
  const parts = split < 0 ? [segments] : [segments.slice(0, split), segments.slice(split)];
  return parts.flatMap((part) => {
    while (part.length && part.at(-1) === 0) part.pop();
    return part;
  });
}

export function compareGem(a: string, b: string) {
  const [left, right] = [canonical(a), canonical(b)];
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const [l, r] = [left[index] ?? 0, right[index] ?? 0];
    if (l === r) continue;
    if (typeof l === 'string' && typeof r === 'number') return -1;
    if (typeof l === 'number' && typeof r === 'string') return 1;
    return l < r ? -1 : 1;
  }
  return 0;
}
