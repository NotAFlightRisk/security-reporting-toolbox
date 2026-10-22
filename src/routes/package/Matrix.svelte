<script lang="ts">
  import type { EcosystemId } from '#lib/ecosystems.ts';
  import { searchable } from '#lib/packages/identify.ts';
  import { lookup, type Lookup } from '#lib/packages/registry.ts';

  let { name, onpick }: { name: string; onpick: (id: EcosystemId, name: string) => void } =
    $props();

  let results = $state<Partial<Record<EcosystemId, Lookup | 'invalid'>>>({});

  $effect(() => {
    const wanted = name;
    results = {};
    let stale = false;
    for (const entry of searchable) {
      if (entry.check(entry.normalise(wanted))?.level === 'error') {
        results[entry.id] = 'invalid';
        continue;
      }
      lookup(entry, entry.normalise(wanted)).then((answer) => {
        if (!stale) results[entry.id] = answer;
      });
    }
    return () => (stale = true);
  });

  const count = (status: string) =>
    searchable.filter((entry) => {
      const result = results[entry.id];
      return typeof result === 'object' && result.status === status;
    }).length;
  const hits = $derived(count('ok'));
  const failed = $derived(count('failed'));
  const done = $derived(searchable.every((entry) => results[entry.id]));
  const id = $props.id();
</script>

<section class="search" aria-labelledby="{id}-title">
  <h2 id="{id}-title" class="label">
    <code>{name}</code> across registries
  </h2>
  <p class="status" role="status">
    {#if !done}Checking {searchable.length} registries...
    {:else if hits === 0 && failed > 0}Not found in the registries that answered, but {failed} couldn't
      be checked, so that's not the full picture.
    {:else if hits === 0}Not found in any registry we can check.
    {:else}Found in {hits === 1 ? 'one registry' : `${hits} registries`}. Pick one for the details.{/if}
  </p>
  <div class="matrix">
    {#each searchable as entry (entry.id)}
      {@const result = results[entry.id]}
      <div class="column">
        <div class="column-head">{entry.name}</div>
        {#if !result}
          <span class="cell dim"><span aria-hidden="true">…</span> Checking</span>
        {:else if result === 'invalid'}
          <span class="cell dim"><span aria-hidden="true">✕</span> Not a valid name here</span>
        {:else if result.status === 'ok'}
          <button
            type="button"
            class="cell found"
            onclick={() => onpick(entry.id, result.data.name)}
          >
            <span aria-hidden="true">✓</span> Found{#if result.data.latest}, <code
                >{result.data.latest}</code
              >{/if}
          </button>
        {:else if result.status === 'missing'}
          <span class="cell dim"><span aria-hidden="true">○</span> Not found</span>
        {:else if result.status === 'failed'}
          <span class="cell failed" title={result.message}
            ><span aria-hidden="true">!</span> Couldn't check</span
          >
        {:else}
          <span class="cell dim">Can't check</span>
        {/if}
      </div>
    {/each}
  </div>
  <p class="note">
    Maven needs <code>group:artifact</code>, Go a module path like <code>golang.org/x/net</code>,
    Composer and Actions <code>vendor/name</code>, and Swift the repo URL.
  </p>
</section>

<style>
  .search {
    display: grid;
    gap: var(--space-2);
    --column: 9rem;
  }

  .status {
    font-size: var(--text-sm);
  }

  .found {
    --cell: var(--good-soft);
    font-weight: 600;
  }

  .failed {
    --cell: var(--warn-soft);
  }

  .note {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
</style>
