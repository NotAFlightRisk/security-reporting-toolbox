<script lang="ts">
  import QueryField from '#lib/components/QueryField.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import type { EcosystemId } from '#lib/ecosystems.ts';
  import { identify } from '#lib/packages/identify.ts';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { tool } from '#lib/tools.ts';
  import Details from './Details.svelte';
  import Guide from './Guide.svelte';
  import Matrix from './Matrix.svelte';

  let input = $state('');
  const query = $derived(param('q'));
  const found = $derived(identify(query, param('ecosystem')));

  $effect(() => {
    input = query;
  });

  const pick = (id: EcosystemId, name: string) => setParams({ q: name, ecosystem: id });
</script>

<ToolPage tool={tool('package')}>
  <QueryField
    bind:value={input}
    label="Package name, PURL or registry URL"
    placeholder="express, pkg:pypi/django or https://crates.io/crates/serde"
    hint="A bare name gets checked in every registry that can be asked from a browser."
    problem={found?.kind === 'invalid' ? found.message : null}
    button="Find"
    onsubmit={(value) => setParams({ q: value, ecosystem: null })}
  />

  {#if found?.kind === 'search'}
    <Matrix name={found.name} onpick={pick} />
  {:else if found?.kind === 'choose'}
    <section class="choose" aria-label="Which ecosystem">
      <p>{found.why} Which one?</p>
      <div class="matrix options">
        {#each found.options as option (option.ecosystem.id)}
          <button type="button" class="cell" onclick={() => pick(option.ecosystem.id, option.name)}>
            <b>{option.ecosystem.name}</b>
            <code>{option.name}</code>
          </button>
        {/each}
      </div>
    </section>
  {:else if found?.kind === 'known'}
    {#key `${found.ecosystem.id}:${found.name}`}
      <Details
        ecosystem={found.ecosystem}
        name={found.name}
        version={found.version}
        via={found.via}
      />
    {/key}
  {/if}

  {#snippet guide()}<Guide />{/snippet}
</ToolPage>

<style>
  .choose {
    display: grid;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }

  .options {
    --column: 16rem;

    & .cell {
      display: grid;
      gap: 2px;
      padding: var(--space-2) var(--space-3);
    }
  }
</style>
