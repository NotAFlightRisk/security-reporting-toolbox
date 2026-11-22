import { error, redirect } from '@sveltejs/kit';
import { cweEntry, cwePages, cweViews, viewNames } from '#lib/server/cwe.ts';

export const entries = () =>
  [...cwePages().map(({ id }) => String(id)), ...Object.keys(viewNames())].map((id) => ({ id }));

export const load = ({ params }) => {
  if (Object.hasOwn(viewNames(), params.id)) {
    const browsable = cweViews().some((view) => String(view.id) === params.id);
    redirect(308, browsable ? `/cwe?view=${params.id}` : `/cwe?q=CWE-${params.id}`);
  }
  const entry = /^\d+$/.test(params.id) ? cweEntry(Number(params.id)) : null;
  if (!entry) error(404, `There's no CWE-${params.id} weakness or category`);
  return entry;
};
