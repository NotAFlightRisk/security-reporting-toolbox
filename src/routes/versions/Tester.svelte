<script lang="ts">
  import { matching, type Range } from '#lib/versions/range.ts';
  import type { Scheme } from '#lib/versions/schemes.ts';

  let { ranges, scheme }: { ranges: Range[]; scheme: Scheme } = $props();

  let input = $state('');
  const id = $props.id();

  const versions = $derived([...new Set(input.split(/[\s,;]+/).filter(Boolean))].slice(0, 200));
  const results = $derived(
    versions.map((version) => {
      if (!scheme.clean(version)) return { version, verdict: 'invalid' as const, range: -1 };
      const range = ranges.length ? matching(ranges, version, scheme) : -1;
      return { version, verdict: range >= 0 ? ('affected' as const) : ('safe' as const), range };
    })
  );
</script>

<section class="panel tester" aria-labelledby="{id}-title">
  <h2 id="{id}-title" class="label">Test versions</h2>
  <label for={id} class="visually-hidden"
    >Versions to test, separated by spaces, commas or new lines</label
  >
  <textarea
    {id}
    class="mono"
    rows="3"
    bind:value={input}
    placeholder="1.0.0, 1.2.3-rc.1, 2.0.0"
    spellcheck="false"></textarea>
  {#if !ranges.length && versions.length}
    <p class="note">Fill in at least one valid range above to test against.</p>
  {:else if results.length}
    <ul>
      {#each results as result (result.version)}
        <li class={result.verdict}>
          <code>{result.version}</code>
          <span>
            {#if result.verdict === 'invalid'}
              not a {scheme.name} version
            {:else if result.verdict === 'affected'}
              <b>affected</b> (range {result.range + 1})
            {:else}
              not affected
            {/if}
          </span>
        </li>
      {/each}
    </ul>
    {#if !scheme.exact}<p class="note">
        Approximate: we don't have this ecosystem's exact version rules.
      </p>{/if}
  {:else}
    <p class="note">
      Paste the versions someone's actually running to see which side of the line they're on.
    </p>
  {/if}
</section>

<style>
  .tester {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
  }

  .mono {
    font-family: var(--font-mono);
  }

  ul {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
  }

  li {
    display: flex;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: var(--hairline) solid var(--line);
    border-radius: var(--radius);
    background: var(--surface-sunk);

    &.affected {
      border-color: var(--bad);
      background: var(--bad-soft);
    }

    &.safe {
      border-left-color: var(--good);
    }

    &.invalid {
      color: var(--text-muted);
    }
  }

  .note {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }
</style>
