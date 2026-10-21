<script lang="ts">
  import { absolute, schemaIds, site } from '#lib/site.ts';

  let {
    title,
    description,
    path,
    crumbs = [],
    schema = []
  }: {
    /** what the page is, without the site name */
    title: string;
    description: string;
    path: string;
    /** trail below the home page, last one being this page */
    crumbs?: { name: string; path: string }[];
    schema?: object[];
  } = $props();

  const home = absolute('/');
  const url = $derived(absolute(path));
  const image = absolute('/og.png');

  const graph = $derived([
    {
      '@type': 'WebSite',
      '@id': schemaIds.website,
      url: home,
      name: site.name,
      description: site.description,
      inLanguage: 'en-GB',
      publisher: { '@id': schemaIds.publisher }
    },
    {
      '@type': 'Organization',
      '@id': schemaIds.publisher,
      name: site.name,
      url: home,
      sameAs: [site.repo]
    },
    {
      '@type': 'WebPage',
      '@id': url,
      url,
      name: title,
      description,
      inLanguage: 'en-GB',
      isPartOf: { '@id': schemaIds.website }
    },
    crumbs.length > 0 && {
      '@type': 'BreadcrumbList',
      itemListElement: [{ name: site.name, path: '/' }, ...crumbs].map((crumb, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: crumb.name,
        item: absolute(crumb.path)
      }))
    },
    ...schema
  ]);

  const json = $derived(
    JSON.stringify({
      '@context': 'https://schema.org',
      '@graph': graph.filter(Boolean)
    }).replaceAll('<', '\\u003c')
  );
  const fullTitle = $derived(path === '/' ? site.name : `${title} - ${site.name}`);
</script>

<svelte:head>
  <title>{fullTitle}</title>
  <meta name="description" content={description} />
  <link rel="canonical" href={url} />
  <meta property="og:type" content="website" />
  <meta property="og:site_name" content={site.name} />
  <meta property="og:locale" content="en_GB" />
  <meta property="og:title" content={title} />
  <meta property="og:description" content={description} />
  <meta property="og:url" content={url} />
  <meta property="og:image" content={image} />
  <meta property="og:image:width" content="1200" />
  <meta property="og:image:height" content="630" />
  <meta name="twitter:card" content="summary_large_image" />
  {@html `<script type="application/ld+json">${json}</script>`}
</svelte:head>
