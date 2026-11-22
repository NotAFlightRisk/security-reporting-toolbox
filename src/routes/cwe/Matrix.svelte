<script lang="ts">
  import { passes, type Filters } from '#lib/cwe/search.ts';
  import type { IndexEntry, View } from '#lib/cwe/types.ts';
  import UsageTag from '#lib/cwe/UsageTag.svelte';

  type Cell = Pick<IndexEntry, 'id' | 'name' | 'kind' | 'usage' | 'status'>;

  let {
    view,
    cells,
    hits,
    filters
  }: {
    view: View;
    cells: Record<number, Cell>;
    /** ids matching the search, or null when nobody's searching */
    hits: Set<number> | null;
    filters: Filters;
  } = $props();

  // wide views pack their columns like a wall of index cards rather than scrolling forever
  const packed = $derived(view.columns.length > 10);

  const lit = (id: number) => {
    const cell = cells[id];
    const shown = cell ? passes(cell, filters) : true;
    return shown && (hits === null || hits.has(id));
  };

  const warning = (id: number) => {
    const usage = cells[id]?.usage;
    return usage === 'Discouraged' || usage === 'Prohibited' ? usage : '';
  };
</script>

<div class="matrix" class:packed style:--column="11rem">
  {#each view.columns as column (column.id)}
    {@const matching = column.members.filter(lit).length}
    <section class="column" aria-labelledby="col-{view.id}-{column.id}">
      <h3 class="column-head" id="col-{view.id}-{column.id}" class:hit={hits?.has(column.id)}>
        <a href="/cwe/{column.id}">{column.name}</a>
        <small>
          {#if hits || matching < column.members.length}
            {matching} of {column.members.length} match
          {:else}
            {column.members.length}
            {column.members.length === 1 ? 'entry' : 'entries'}
          {/if}
        </small>
      </h3>
      {#each column.members as id (id)}
        <a class="cell" class:hit={hits && lit(id)} class:dim={!lit(id)} href="/cwe/{id}">
          <span class="mono">CWE-{id} <UsageTag usage={warning(id)} /></span>
          {cells[id]?.name ?? ''}
        </a>
      {/each}
    </section>
  {/each}
</div>

<style>
  .matrix {
    font-size: var(--text-xs);
  }

  .packed {
    display: block;
    columns: var(--column);
    column-gap: var(--space-2);

    & .column {
      break-inside: avoid;
      margin-bottom: var(--space-2);
    }
  }

  .column-head {
    & a {
      color: inherit;
      text-decoration: none;

      &:hover {
        text-decoration: underline;
      }
    }

    &.hit {
      background: var(--accent-soft);
    }
  }

  .cell {
    font-size: var(--text-xs);

    & .mono {
      display: block;
      color: var(--text-muted);
      font-size: var(--text-xs);
    }
  }
</style>
