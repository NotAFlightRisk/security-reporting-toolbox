<script lang="ts">
  import Severity from '#lib/components/Severity.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import { formatDate, plural } from '#lib/format.ts';
  import type { Outcome } from '#lib/net/fetch.ts';
  import { pageSize, type NvdPage } from '#lib/sources/nvd.ts';
  import { headlineScore } from '#lib/sources/summary.ts';

  let {
    outcome,
    page,
    what,
    empty = '',
    onpage,
    retry
  }: {
    outcome: Outcome<NvdPage> | undefined;
    page: number;
    /** "matching log4j", for the count line */
    what: string;
    /** what to try next when nothing matched */
    empty?: string;
    onpage: (page: number) => void;
    retry: () => void;
  } = $props();

  const pages = $derived(outcome?.status === 'ok' ? Math.ceil(outcome.data.total / pageSize) : 0);
</script>

<SourceState source="NVD" {outcome} {retry} />

{#if outcome?.status === 'ok'}
  <div class="results">
    <p class="count" role="status">
      {plural(outcome.data.total, 'CVE')}
      {what}{outcome.data.total ? `, newest first (page ${page + 1} of ${pages})` : ''}.
    </p>
    {#if outcome.data.items.length}
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">CVE</th>
              <th scope="col">Published</th>
              <th scope="col">Score</th>
              <th scope="col">Summary</th>
            </tr>
          </thead>
          <tbody>
            {#each outcome.data.items as item (item.id)}
              {@const best = headlineScore(
                item.scores.filter((score) => score.primary).concat(item.scores)
              )}
              <tr class:rejected={item.status === 'Rejected'}>
                <th scope="row"><a href="/cve?id={item.id}"><code>{item.id}</code></a></th>
                <td class="date">{formatDate(item.published)}</td>
                <td>
                  {#if best}
                    <Severity score={best.score} label="CVSS {best.version}" />
                  {:else}
                    <span class="dim">{item.status === 'Rejected' ? 'Rejected' : 'Unscored'}</span>
                  {/if}
                </td>
                <td><span class="summary">{item.description}</span></td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
      {#if pages > 1}
        <nav class="pager" aria-label="Result pages">
          <button
            type="button"
            class="button"
            disabled={page === 0}
            onclick={() => onpage(page - 1)}
          >
            Newer
          </button>
          <button
            type="button"
            class="button"
            disabled={page + 1 >= pages}
            onclick={() => onpage(page + 1)}
          >
            Older
          </button>
        </nav>
      {/if}
    {:else if empty}
      <p class="empty">{empty}</p>
    {/if}
  </div>
{/if}

<style>
  .results {
    display: grid;
    gap: var(--space-2);
  }

  .count {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .empty {
    max-width: var(--measure);
    font-size: var(--text-sm);
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    font-size: var(--text-sm);

    & :is(th, td) {
      padding: var(--space-1) var(--space-2);
      border: var(--hairline) solid var(--line);
      text-align: start;
      vertical-align: top;
    }

    & thead th {
      background: var(--surface-raised);
    }

    & tbody th {
      font-weight: 450;
      white-space: nowrap;
    }
  }

  .date {
    white-space: nowrap;
  }

  .summary {
    display: -webkit-box;
    min-width: 18rem;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
  }

  .rejected .summary,
  .dim {
    color: var(--text-faint);
  }

  .pager {
    display: flex;
    gap: var(--space-1);
  }
</style>
