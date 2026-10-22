<script lang="ts">
  import { goto } from '$app/navigation';
  import QueryField from '#lib/components/QueryField.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import ToolIcon from '#lib/components/ToolIcon.svelte';
  import { route, type Choice } from '#lib/route.ts';
  import { absolute, site } from '#lib/site.ts';
  import { tools } from '#lib/tools.ts';

  let value = $state('');
  let choices = $state<Choice[]>([]);
  let problem = $state<string | null>(null);

  function submit(input: string) {
    const routed = route(input);
    problem = routed ? null : 'Paste something first, like CVE-2021-44228 or CWE-79.';
    choices = routed && 'choices' in routed ? routed.choices : [];
    if (routed && 'href' in routed) goto(routed.href);
  }

  const list = {
    '@type': 'ItemList',
    name: 'Tools',
    itemListElement: tools.map((entry, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: entry.title,
      url: absolute(entry.path)
    }))
  };
</script>

<Seo title={site.name} description={site.description} path="/" schema={[list]} />

<header class="head">
  <h1>{site.name}</h1>
  <p>
    The fiddly bits of writing a security report, in one place. Paste whatever you've got and it'll
    go to the right tool.
  </p>
</header>

<section class="start" aria-label="Paste anything">
  <QueryField
    bind:value
    label="CVE, GHSA, CWE, CVSS vector, package name, PURL or link"
    placeholder="CVE-2021-44228"
    hint="Paste a list of CVEs to check them all against EPSS or KEV in one go."
    {problem}
    button="Go"
    onsubmit={submit}
  />
  {#if choices.length}
    <nav class="choices ruled" aria-label="Where to look">
      <span class="label">That could be a few things</span>
      {#each choices as choice (choice.href)}
        <a class="cell" href={choice.href}>{choice.label}</a>
      {/each}
    </nav>
  {/if}
</section>

<ul class="tiles ruled" aria-label="All tools">
  {#each tools as entry (entry.id)}
    <li>
      <ToolIcon id={entry.id} size={24} />
      <h2><a href={entry.path}>{entry.title}</a></h2>
      <p>{entry.lede}</p>
    </li>
  {/each}
</ul>

<style>
  .head {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-7) var(--space-5);

    & h1 {
      font-size: clamp(var(--text-xl), 5vw, 2.75rem);
      letter-spacing: -0.02em;
    }

    & p {
      max-width: var(--measure);
      color: var(--text-muted);
      font-size: var(--text-md);
    }
  }

  .start {
    display: grid;
    gap: var(--space-2);
    max-width: 48rem;
    margin-bottom: var(--space-7);
  }

  .choices .label {
    padding: var(--space-1) var(--space-2);
    background: var(--surface-sunk);
  }

  /* 4, 2 or 1 across, so the grid never has a hole */
  .tiles {
    display: grid;
    grid-template-columns: repeat(var(--across, 1), minmax(0, 1fr));

    @media (width >= 36rem) {
      --across: 2;
    }

    @media (width >= 64rem) {
      --across: 4;
    }

    & li {
      position: relative;
      display: grid;
      align-content: start;
      gap: var(--space-2);
      padding: var(--space-4) var(--space-4) var(--space-5);
      background: var(--surface);
      color: var(--accent);

      &:hover {
        background: var(--surface-sunk);
      }

      &:has(a:focus-visible) {
        outline: 2px solid var(--focus);
        outline-offset: -2px;
      }
    }

    & h2 {
      font-size: var(--text-md);
    }

    /* the whole tile clicks, but the link's name is just the title */
    & a {
      color: var(--text);
      text-decoration: none;

      &::after {
        content: '';
        position: absolute;
        inset: 0;
      }

      &:focus-visible {
        outline: none;
      }
    }

    & p {
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
  }
</style>
