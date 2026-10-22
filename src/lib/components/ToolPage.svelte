<script lang="ts">
  import type { Snippet } from 'svelte';
  import Seo from '#lib/components/Seo.svelte';
  import ToolIcon from '#lib/components/ToolIcon.svelte';
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
  <h1><ToolIcon id={tool.id} size={30} /> {tool.title}</h1>
  <p>{tool.lede}</p>
</header>

<section class="tool" aria-label={tool.title}>
  {@render children()}
</section>

{#if guide}
  <article class="guide doc">
    {@render guide()}
  </article>
{/if}

<style>
  .head {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-6) var(--space-5);

    & h1 {
      display: flex;
      align-items: center;
      gap: var(--space-3);
      font-size: var(--text-xl);
      letter-spacing: -0.015em;

      & :global(svg) {
        flex: none;
        color: var(--accent);
      }
    }

    & p {
      max-width: var(--measure);
      color: var(--text-muted);
      font-size: var(--text-md);
    }
  }

  /* minmax(0) so a long URL or vector can't stretch the page past the screen */
  .tool {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-3);
  }

  .guide {
    margin-top: var(--space-8);
    padding-top: var(--space-7);
    border-top: var(--hairline) solid var(--line);
  }
</style>
