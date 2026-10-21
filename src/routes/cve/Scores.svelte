<script lang="ts" module>
  import type { Score } from '#lib/sources/types.ts';

  export interface Column {
    name: string;
    note?: string;
    /** undefined while the source is still answering */
    scores: Score[] | undefined;
  }
</script>

<script lang="ts">
  import Severity from '#lib/components/Severity.svelte';

  let { columns }: { columns: Column[] } = $props();
</script>

<div class="matrix scores" role="list" aria-label="CVSS scores by source">
  {#each columns as column (column.name)}
    <div class="column" role="listitem">
      <div class="column-head">
        <span>{column.name}</span>
        {#if column.note}<small>{column.note}</small>{/if}
      </div>
      {#if !column.scores}
        <span class="cell dim">Waiting...</span>
      {:else if column.scores.length === 0}
        <span class="cell dim">No score given</span>
      {:else}
        {#each column.scores as score (score.vector)}
          <a
            class="cell score"
            href="/cvss?vector={encodeURIComponent(score.vector)}"
            title="Open this vector in the CVSS calculator"
          >
            <span class="label">CVSS {score.version}</span>
            {#if score.score === null}
              <span class="unscored">Vector only</span>
            {:else}
              <Severity score={score.score} label="{column.name} CVSS {score.version}" />
            {/if}
            <code>{score.vector}</code>
          </a>
        {/each}
      {/if}
    </div>
  {/each}
</div>

<style>
  .scores {
    --column: 13rem;
  }

  .score {
    display: grid;
    gap: var(--space-1);
    padding-block: var(--space-2);

    & code {
      color: var(--text-muted);
      font-size: var(--text-xs);
      overflow-wrap: anywhere;
    }
  }

  .unscored {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
</style>
