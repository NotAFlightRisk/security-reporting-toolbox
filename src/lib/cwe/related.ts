import type { Weakness } from './types.ts';

const labels: [string, string][] = [
  ['ChildOf', 'Parents'],
  ['children', 'Children'],
  ['PeerOf', 'Peers'],
  ['CanAlsoBe', 'Can also be'],
  ['CanPrecede', 'Can lead to'],
  ['CanFollow', 'Can follow from'],
  ['Requires', 'Requires'],
  ['StartsWith', 'Starts with']
];

/** the research view's relationships, grouped the way people read them */
export function groupRelated(weakness: Pick<Weakness, 'related' | 'children'>) {
  return labels
    .map(([nature, label]) => {
      const ids =
        nature === 'children'
          ? weakness.children
          : weakness.related.filter((link) => link.nature === nature).map((link) => link.id);
      return { label, ids: [...new Set(ids)] };
    })
    .filter(({ ids }) => ids.length > 0);
}
