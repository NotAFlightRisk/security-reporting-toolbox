<script lang="ts">
  import Stamp from '#lib/components/Stamp.svelte';
  import { retired } from '#lib/cwe/search.ts';
  import type { IndexEntry } from '#lib/cwe/types.ts';
  import UsageTag from '#lib/cwe/UsageTag.svelte';

  let { results }: { results: IndexEntry[] } = $props();

  let limit = $state(25);
  const shown = $derived(results.slice(0, limit));
</script>

<ol class="ruled">
  {#each shown as entry (entry.id)}
    <li>
      <a href="/cwe/{entry.id}">
        <span class="id mono">CWE-{entry.id}</span>
        <span class="name">{entry.name}</span>
        <span class="tags">
          <span class="kind">{entry.kind}</span>
          <UsageTag usage={entry.usage} />
          {#if retired(entry)}<Stamp word={entry.status} />{/if}
        </span>
        <span class="summary">{entry.summary}</span>
      </a>
    </li>
  {/each}
</ol>

{#if results.length > limit}
  <button type="button" class="button more" onclick={() => (limit = results.length)}>
    Show all {results.length}
  </button>
{/if}

<style>
  a {
    display: grid;
    grid-template-columns: 5.5rem 1fr auto;
    gap: 2px var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--surface);
    color: var(--text);
    text-decoration: none;

    &:hover {
      background: var(--surface-sunk);

      & .name {
        text-decoration: underline;
      }
    }
  }

  .id {
    color: var(--accent);
    font-weight: 650;
  }

  .name {
    font-weight: 600;
  }

  .tags {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: var(--space-1);
  }

  .kind {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .summary {
    grid-column: 2 / -1;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .more {
    justify-self: start;
  }

  @media (max-width: 40rem) {
    a {
      grid-template-columns: 1fr auto;
    }

    .name,
    .summary {
      grid-column: 1 / -1;
    }
  }
</style>
