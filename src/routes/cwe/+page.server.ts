import { cweIndex, cweRelease, cweViews, viewNames } from '#lib/server/cwe.ts';

export const load = () => {
  const views = cweViews();
  const shown = new Set(
    views.flatMap((view) => view.columns.flatMap((column) => [column.id, ...column.members]))
  );
  const cells = Object.fromEntries(
    cweIndex()
      .filter((entry) => shown.has(entry.id))
      .map(({ id, name, kind, usage, status }) => [id, { id, name, kind, usage, status }])
  );
  return { ...cweRelease(), views, cells, viewNames: viewNames() };
};
