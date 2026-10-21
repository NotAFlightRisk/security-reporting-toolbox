<script lang="ts">
  import { goto } from '$app/navigation';
  import QueryField from '#lib/components/QueryField.svelte';
  import Seo from '#lib/components/Seo.svelte';
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

  const steps = [
    { tool: '/cwe', text: 'Pin down the weakness. Name the root cause, not the impact.' },
    { tool: '/cvss', text: 'Score it. CVSS 4.0 if the place you report to takes it, 3.1 if not.' },
    { tool: '/package', text: 'Get the package name exactly right, plus its PURL.' },
    {
      tool: '/versions',
      text: 'Write the affected and patched versions in the format GitHub wants.'
    },
    { tool: '/cna', text: "Work out who can give it a CVE, if it hasn't got one." },
    { tool: '/cve', text: 'Already public? Check what NVD, GitHub and OSV say, plus EPSS and KEV.' }
  ];

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
    <nav class="choices" aria-label="Where to look">
      <span class="label">That could be a few things</span>
      {#each choices as choice (choice.href)}
        <a class="cell" href={choice.href}>{choice.label}</a>
      {/each}
    </nav>
  {/if}
</section>

<section class="matrix tools" aria-label="All tools">
  {#each tools as entry (entry.id)}
    <div class="column">
      <a class="column-head" href={entry.path}>
        {entry.title}
        <small>{entry.lede}</small>
      </a>
      {#each entry.can as item (item)}
        <span class="cell">{item}</span>
      {/each}
    </div>
  {/each}
</section>

<article class="flow">
  <h2>A report, start to finish</h2>
  <ol>
    {#each steps as step (step.tool)}
      {@const entry = tools.find((candidate) => candidate.path === step.tool)!}
      <li><a href={entry.path}>{entry.title}</a> {step.text}</li>
    {/each}
  </ol>
  <p>
    Everything runs in your browser and talks to the official sources directly: MITRE for CWE, the
    CVE Program and NVD for CVEs, GitHub and OSV for advisories, FIRST for EPSS and CVSS, CISA for
    KEV and deps.dev for packages. <a href="/about">More on the sources</a>.
  </p>
</article>

<style>
  .head {
    display: grid;
    gap: var(--space-2);
    padding-block: var(--space-6) var(--space-4);

    & h1 {
      font-size: var(--text-xl);
      letter-spacing: -0.01em;
    }

    & p {
      max-width: var(--measure);
      color: var(--text-muted);
    }
  }

  .start {
    display: grid;
    gap: var(--space-2);
    max-width: 48rem;
    margin-bottom: var(--space-6);
  }

  .choices {
    display: grid;
    gap: var(--hairline);
    border: var(--hairline) solid var(--line);
    background: var(--line);

    & .label {
      padding: var(--space-1) var(--space-2);
      background: var(--surface-raised);
    }
  }

  /* eight tools, so two rows of four, or four rows of two */
  .tools {
    grid-template-columns: repeat(2, 1fr);

    @media (min-width: 64rem) {
      grid-template-columns: repeat(4, 1fr);
    }

    & .column-head {
      color: var(--text);
      text-decoration: none;

      &:hover {
        background: var(--accent-soft);
      }
    }
  }

  .flow {
    display: grid;
    gap: var(--space-3);
    max-width: var(--measure);
    margin-top: var(--space-7);

    & h2 {
      font-size: var(--text-lg);
    }

    & ol {
      display: grid;
      gap: var(--space-2);
      margin: 0;
      padding-left: var(--space-5);
    }

    & p {
      color: var(--text-muted);
    }
  }
</style>
