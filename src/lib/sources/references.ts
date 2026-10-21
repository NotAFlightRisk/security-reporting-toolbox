import type { Reference } from './types.ts';

export type Bucket = 'Patch' | 'Advisory' | 'Exploit' | 'Issue' | 'Discussion' | 'Other';

export const buckets: Bucket[] = ['Patch', 'Advisory', 'Exploit', 'Issue', 'Discussion', 'Other'];

// CVE JSON says "vendor-advisory", NVD says "Vendor Advisory", so match loosely
const rules: [Bucket, RegExp][] = [
  ['Exploit', /exploit/],
  ['Patch', /patch|release.?notes|fix/],
  ['Advisory', /advisory|vdb|technical.?description/],
  ['Issue', /issue|bug/],
  ['Discussion', /mailing|list|press|media/]
];

export function bucket(tags: string[]): Bucket {
  const flat = tags.map((tag) => tag.toLowerCase()).join(' ');
  return rules.find(([, pattern]) => pattern.test(flat))?.[0] ?? 'Other';
}

/** merges references from several sources by URL, keeping every tag anyone gave */
export function mergeReferences(...sources: Reference[][]) {
  const byUrl = new Map<string, Reference>();
  for (const reference of sources.flat()) {
    const key = reference.url.replace(/\/$/, '');
    const seen = byUrl.get(key);
    if (!seen) byUrl.set(key, { ...reference, tags: [...reference.tags] });
    else {
      seen.name ||= reference.name;
      seen.tags = [...new Set([...seen.tags, ...reference.tags])];
    }
  }
  return [...byUrl.values()];
}

export function groupReferences(references: Reference[]) {
  const groups = new Map<Bucket, Reference[]>(buckets.map((name) => [name, []]));
  for (const reference of references) groups.get(bucket(reference.tags))!.push(reference);
  return buckets
    .map((name) => ({ name, references: groups.get(name)! }))
    .filter((group) => group.references.length);
}
