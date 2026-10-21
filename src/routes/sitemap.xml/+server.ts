import { cwePages, cweRelease } from '#lib/server/cwe.ts';
import { absolute } from '#lib/site.ts';
import { tools } from '#lib/tools.ts';

export const prerender = true;

// lastmod only where there's a real date to give
export const GET = () => {
  const { date } = cweRelease();
  const pages = [
    { path: '/' },
    ...tools.map(({ path }) => ({ path })),
    { path: '/about' },
    ...cwePages().map(({ id }) => ({ path: `/cwe/${id}`, modified: date }))
  ];
  const urls = pages
    .map(
      ({ path, modified }: { path: string; modified?: string }) =>
        `<url><loc>${absolute(path)}</loc>${modified ? `<lastmod>${modified}</lastmod>` : ''}</url>`
    )
    .join('');
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { 'Content-Type': 'application/xml' } }
  );
};
