import { error } from '@sveltejs/kit';
import { cweEntry, cwePages } from '#lib/server/cwe.ts';

export const entries = () => cwePages().map(({ id }) => ({ id: String(id) }));

export const load = ({ params }) => {
  const entry = /^\d+$/.test(params.id) ? cweEntry(Number(params.id)) : null;
  if (!entry) error(404, `There's no CWE-${params.id} weakness or category`);
  return entry;
};
