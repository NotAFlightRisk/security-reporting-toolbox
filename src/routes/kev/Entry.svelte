<script lang="ts">
  import CopyButton from '#lib/components/CopyButton.svelte';
  import Interchange from '#lib/components/Interchange.svelte';
  import { formatDate } from '#lib/format.ts';
  import type { KevEntry } from '#lib/sources/kev.ts';

  let { entry }: { entry: KevEntry } = $props();

  const links = $derived([
    { href: `/cve?id=${entry.cve}`, label: 'CVE lookup' },
    { href: `/epss?cve=${entry.cve}`, label: 'EPSS' },
    ...entry.cwes.slice(0, 3).map((id) => ({ href: `/cwe/${id}`, label: `CWE-${id}` }))
  ]);
  const citation = $derived(
    `${entry.cve} is in CISA's Known Exploited Vulnerabilities catalogue (added ${entry.added}).`
  );
</script>

<article class="entry panel">
  <header>
    <span class="verdict">In KEV</span>
    <h2><code>{entry.cve}</code></h2>
    <CopyButton text={citation} label="Copy a citation" compact />
  </header>
  <p class="name">{entry.name}</p>
  <dl>
    <div>
      <dt>Vendor</dt>
      <dd>{entry.vendor}</dd>
    </div>
    <div>
      <dt>Product</dt>
      <dd>{entry.product}</dd>
    </div>
    <div>
      <dt>Added</dt>
      <dd>{formatDate(entry.added)}</dd>
    </div>
    <div>
      <dt>Due</dt>
      <dd>{formatDate(entry.due) || 'Not given'}</dd>
    </div>
    <div>
      <dt>Ransomware</dt>
      <dd>{entry.ransomware ? 'Known to be used in ransomware campaigns' : 'Unknown'}</dd>
    </div>
  </dl>
  {#if entry.description}<p>{entry.description}</p>{/if}
  <div class="action">
    <span class="label">Required action</span>
    <p>{entry.action}</p>
  </div>
  {#if entry.notes.length}
    <ul class="notes">
      {#each entry.notes as note (note.url)}
        <li><a href={note.url} rel="external noreferrer">{note.label || note.url}</a></li>
      {/each}
    </ul>
  {/if}
  <Interchange {links} />
</article>

<style>
  .entry {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-3) var(--space-4);
    border: var(--hairline) solid var(--bad);

    & header {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--space-2) var(--space-3);
    }

    & h2 {
      font-size: var(--text-md);
    }
  }

  .verdict {
    padding: 1px var(--space-2);
    background: var(--bad);
    color: var(--surface);
    font-size: var(--text-xs);
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .name {
    font-weight: 600;
  }

  dl {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2) var(--space-5);
    margin: 0;
    font-size: var(--text-sm);

    & div {
      display: grid;
    }

    & dt {
      color: var(--text-muted);
      font-size: var(--text-xs);
    }

    & dd {
      margin: 0;
    }
  }

  .action {
    display: grid;
    gap: var(--space-1);
    max-width: var(--measure);
    font-size: var(--text-sm);
  }

  .notes {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding-left: var(--space-4);
    font-size: var(--text-sm);
    overflow-wrap: anywhere;
  }
</style>
