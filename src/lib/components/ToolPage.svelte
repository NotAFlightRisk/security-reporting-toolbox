<script lang="ts">
  import type { Snippet } from 'svelte';
  import Seo from '#lib/components/Seo.svelte';
  import { absolute, schemaIds } from '#lib/site.ts';
  import type { Tool } from '#lib/tools.ts';

  let {
    tool,
    schema = [],
    children,
    guide
  }: {
    tool: Tool;
    /** extra structured data, like a FAQPage for the guide */
    schema?: object[];
    children: Snippet;
    guide?: Snippet;
  } = $props();

  const app = $derived({
    '@type': 'WebApplication',
    '@id': absolute(`${tool.path}#tool`),
    name: tool.title,
    description: tool.lede,
    url: absolute(tool.path),
    applicationCategory: 'SecurityApplication',
    operatingSystem: 'Any',
    browserRequirements: 'Requires JavaScript',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'GBP' },
    featureList: tool.can,
    isPartOf: { '@id': schemaIds.website }
  });
</script>

<Seo
  title={tool.title}
  description={tool.lede}
  path={tool.path}
  crumbs={[{ name: tool.title, path: tool.path }]}
  schema={[app, ...schema]}
/>

<header class="head">
  <h1>{tool.title}</h1>
  <p>{tool.lede}</p>
</header>

<section class="tool" aria-label={tool.title}>
  {@render children()}
</section>

{#if guide}
  <article class="guide">
    {@render guide()}
  </article>
{/if}

<style>
  .head {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-5) var(--space-4);

    & h1 {
      font-size: var(--text-xl);
      letter-spacing: -0.01em;
    }

    & p {
      max-width: var(--measure);
      color: var(--text-muted);
    }
  }

  /* minmax(0) so a long URL or vector can't stretch the page past the screen */
  .tool {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-3);
  }

  /* the guide reads like documentation, so it gets prose spacing */
  .guide {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-4);
    max-width: var(--measure);
    margin-top: var(--space-8);
    padding-top: var(--space-5);
    border-top: var(--hairline) solid var(--line-strong);

    & :global(code) {
      overflow-wrap: anywhere;
    }

    & :global(h2) {
      margin-top: var(--space-5);
      font-size: var(--text-lg);
    }

    & :global(h3) {
      margin-top: var(--space-3);
      font-size: var(--text-md);
    }

    & :global(:is(ul, ol)) {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding-left: var(--space-5);
    }

    & :global(pre) {
      margin: 0;
      padding: var(--space-3);
      overflow-x: auto;
      border: var(--hairline) solid var(--line);
      background: var(--surface);
      font-size: var(--text-sm);
    }

    & :global(table) {
      border-collapse: collapse;
      font-size: var(--text-sm);

      & :global(:is(th, td)) {
        padding: var(--space-1) var(--space-2);
        border: var(--hairline) solid var(--line);
        text-align: start;
        vertical-align: top;
      }

      & :global(th) {
        background: var(--surface-raised);
      }
    }

    & :global(dl) {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--space-1) var(--space-4);
      margin: 0;

      & :global(dt) {
        font-weight: 600;
      }

      & :global(dd) {
        margin: 0;
      }
    }
  }
</style>
