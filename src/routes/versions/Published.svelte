<script lang="ts">
  import SourceState from '#lib/components/SourceState.svelte';
  import type { Ecosystem } from '#lib/ecosystems.ts';
  import { plural } from '#lib/format.ts';
  import { lookup, type Lookup } from '#lib/packages/registry.ts';
  import { matching, schemeOf, type Range } from '#lib/versions/range.ts';

  let { ranges, ecosystem, name }: { ranges: Range[]; ecosystem: Ecosystem; name: string } =
    $props();

  let result = $state<Lookup>();
  let attempt = $state(0);
  const id = $props.id();

  // wait for typing to settle, and drop answers for a name that's since changed
  $effect(() => {
    const [wanted, from] = [name, ecosystem];
    void attempt;
    result = undefined;
    let stale = false;
    const timer = setTimeout(async () => {
      const answer = await lookup(from, wanted);
      if (!stale) result = answer;
    }, 500);
    return () => {
      stale = true;
      clearTimeout(timer);
    };
  });

  const scheme = $derived(schemeOf(ecosystem));
  const releases = $derived(result?.status === 'ok' ? result.data.releases : []);
  const readable = $derived(releases.filter((release) => scheme.clean(release.version)));
  const hits = $derived(
    ranges.length
      ? readable.filter((release) => matching(ranges, release.version, scheme) >= 0)
      : []
  );
  const named = $derived(
    [
      ...new Set(
        ranges.flatMap((range) => [range.introduced, range.end === 'open' ? '' : range.version])
      )
    ].filter((version) => version && scheme.clean(version))
  );
  const unpublished = $derived(
    readable.length
      ? named.filter(
          (version) => !readable.some((release) => scheme.compare(release.version, version) === 0)
        )
      : []
  );
</script>

<section class="panel published" aria-labelledby="{id}-title">
  <h2 id="{id}-title" class="label">Published versions of <code>{name}</code></h2>
  {#if result?.status === 'unsupported'}
    <p class="note">{result.reason}</p>
  {:else if result?.status !== 'ok'}
    <SourceState
      source={ecosystem.depsDev ? 'deps.dev' : ecosystem.registry === 'pub' ? 'pub.dev' : 'hex.pm'}
      outcome={result}
      missing="doesn't know a {ecosystem.name} package called {name}, so check the spelling"
      retry={() => attempt++}
    />
  {:else}
    {#if unpublished.length}
      <p class="warn" role="status">
        {unpublished.join(', ')}
        {unpublished.length === 1 ? "isn't" : "aren't"} a published version. Typo, or a release that's
        not out yet?
      </p>
    {/if}
    {#if ranges.length}
      <p>
        <b>{hits.length}</b> of {plural(readable.length, 'published version')} fall in these ranges.
      </p>
      {#if hits.length}
        <details>
          <summary>Show the affected versions</summary>
          <ul class="versions">
            {#each hits as release (release.version)}<li><code>{release.version}</code></li>{/each}
          </ul>
        </details>
      {/if}
    {:else}
      <p class="note">
        {plural(readable.length, 'published version')}. Fill in a range to see which are affected.
      </p>
    {/if}
    <p class="note">
      From <a href={result.data.source.url} rel="external">{result.data.source.name}</a
      >{#if result.data.latest}, latest
        <code>{result.data.latest}</code>{/if}.
    </p>
  {/if}
</section>

<style>
  .published {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    font-size: var(--text-sm);
  }

  .note {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .warn {
    padding: var(--space-1) var(--space-2);
    border: var(--hairline) solid var(--warn);
    background: var(--warn-soft);
  }

  summary {
    cursor: pointer;
  }

  .versions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1);
    max-height: 14rem;
    margin: var(--space-2) 0 0;
    padding: 0;
    overflow-y: auto;
    list-style: none;

    & li {
      padding: 1px var(--space-1);
      border: var(--hairline) solid var(--line);
      background: var(--surface-sunk);
      font-size: var(--text-xs);
    }
  }
</style>
