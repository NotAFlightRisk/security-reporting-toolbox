import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { summarise } from '#lib/cwe/text.ts';
import type { Catalogue, Category, IndexEntry, Weakness } from '#lib/cwe/types.ts';

// read rather than imported, so TypeScript never tries to type 3MB of JSON
let catalogue: Catalogue | undefined;
const load = () =>
  (catalogue ??= JSON.parse(readFileSync(resolve('src/lib/data/cwe.json'), 'utf8')) as Catalogue);

let lookup: Map<number, Weakness | Category> | undefined;
const byId = () =>
  (lookup ??= new Map<number, Weakness | Category>(
    [...load().weaknesses, ...load().categories].map((entry) => [entry.id, entry])
  ));

const isWeakness = (entry: Weakness | Category): entry is Weakness => 'abstraction' in entry;

export const cweRelease = () => ({ version: load().version, date: load().date });

/** every weakness and category, which is every /cwe/<id> page and sitemap entry */
export const cwePages = () => [...byId().values()].map(({ id, name }) => ({ id, name }));

export function cweIndex(): IndexEntry[] {
  return [...byId().values()].map((entry) => {
    const description = isWeakness(entry) ? entry.description : String(entry.summary[0] ?? '');
    return {
      id: entry.id,
      name: entry.name,
      kind: isWeakness(entry) ? entry.abstraction : 'Category',
      status: entry.status,
      usage: entry.mapping?.usage ?? '',
      terms: isWeakness(entry) ? entry.terms.map(({ term }) => term) : [],
      summary: summarise(description, 120)
    };
  });
}

export const cweViews = () => load().views;

export const viewNames = () => load().viewNames;

/** everything the /cwe/<id> page shows, with names for every CWE it mentions */
export function cweEntry(id: number) {
  const entry = byId().get(id);
  if (!entry) return null;
  const memberOf = load()
    .categories.filter((category) => category.members.includes(id))
    .map(({ id, name, status }) => ({ id, name, status }));
  const views = load()
    .views.filter((view) =>
      view.columns.some((column) => column.id === id || column.members.includes(id))
    )
    .map(({ id, label }) => ({ id, label }));
  const mentioned = new Set(
    [...JSON.stringify(entry).matchAll(/CWE-(\d+)|"id":(\d+)/g)].map((match) =>
      Number(match[1] ?? match[2])
    )
  );
  if (isWeakness(entry)) entry.children.forEach((child) => mentioned.add(child));
  else entry.members.forEach((member) => mentioned.add(member));
  const names: Record<number, string> = {};
  for (const ref of mentioned) {
    const found = byId().get(ref);
    if (found && ref !== id) names[ref] = found.name;
  }
  return {
    ...cweRelease(),
    weakness: isWeakness(entry) ? entry : null,
    category: isWeakness(entry) ? null : entry,
    memberOf,
    views,
    names
  };
}
