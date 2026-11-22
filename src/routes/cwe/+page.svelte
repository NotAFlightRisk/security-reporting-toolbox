<script lang="ts">
  import { onMount } from 'svelte';
  import QueryField from '#lib/components/QueryField.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import ToolGroup from '#lib/components/ToolGroup.svelte';
  import Toolbar from '#lib/components/Toolbar.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { noFilters, passes, search, type Filters } from '#lib/cwe/search.ts';
  import type { IndexEntry } from '#lib/cwe/types.ts';
  import { formatDate, plural } from '#lib/format.ts';
  import { cweId } from '#lib/ids.ts';
  import { getJson, type Outcome } from '#lib/net/fetch.ts';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { tool } from '#lib/tools.ts';
  import Guide from './Guide.svelte';
  import Matrix from './Matrix.svelte';
  import Results from './Results.svelte';

  let { data } = $props();

  const kinds = ['all', 'Base', 'Variant', 'Class', 'Pillar', 'Compound', 'Category'] as const;
  const usages = ['any', 'Allowed', 'Allowed-with-Review', 'Discouraged', 'Prohibited'] as const;

  let value = $state('');
  let index = $state<Outcome<IndexEntry[]>>();

  const query = $derived(param('q'));
  const filters = $derived<Filters>({
    kind: kinds.find((kind) => kind === param('kind')) ?? noFilters.kind,
    usage: usages.find((usage) => usage === param('usage')) ?? noFilters.usage,
    hideRetired: param('deprecated') !== '1'
  });
  const view = $derived(
    data.views.find((option) => String(option.id) === param('view')) ?? data.views[0]
  );

  // keeps the box in step with the URL, so back and forward redo the search
  $effect(() => {
    value = query;
  });

  const loadIndex = async () => (index = await getJson<IndexEntry[]>('/cwe/index.json'));
  onMount(loadIndex);

  const entries = $derived(index?.status === 'ok' ? index.data : []);
  const live = $derived(value.trim());
  const matched = $derived(search(entries, live));
  const results = $derived(matched.filter((entry) => passes(entry, filters)));
  const hits = $derived(
    live && index?.status === 'ok' ? new Set(results.map((entry) => entry.id)) : null
  );
  const inView = $derived(
    hits ? view.columns.flatMap((column) => column.members).filter((id) => hits.has(id)).length : 0
  );

  const problem = $derived.by(() => {
    const id = cweId(live);
    if (id === null || !entries.length || results.length) return null;
    const viewName = data.viewNames[id];
    if (viewName)
      return `CWE-${id} is a view (${viewName}), not a weakness. Pick an entry inside it.`;
    if (entries.some((entry) => entry.id === id)) return `CWE-${id} is hidden by the filters.`;
    return `There's no CWE-${id} in CWE ${data.version}. Check the number, or search by keyword.`;
  });

  // typing and filtering swap the history entry rather than piling them up
  const keep = (values: Record<string, string | null>) => setParams(values, { replace: true });
  const submit = (text: string) => keep({ q: text.trim() || null });
  const filter = (name: 'kind' | 'usage', choice: string) =>
    keep({ [name]: choice === noFilters[name] ? null : choice });
  const pickView = (id: number) => setParams({ view: id === data.views[0].id ? null : String(id) });
</script>

<ToolPage tool={tool('cwe')} {guide}>
  <QueryField
    bind:value
    label="Search CWEs"
    placeholder="CWE-79, XSS, path traversal, IDOR..."
    hint="ID or keywords. Matches light up in the matrix below as you type."
    {problem}
    button="Search"
    onsubmit={submit}
    oninput={submit}
  />

  <Toolbar label="Browse and filter">
    <ToolGroup caption="View">
      <div class="segments">
        {#each data.views as option (option.id)}
          <button
            type="button"
            class="cell"
            aria-pressed={option.id === view.id}
            onclick={() => pickView(option.id)}>{option.label}</button
          >
        {/each}
      </div>
    </ToolGroup>
    <ToolGroup caption="Abstraction">
      <select
        value={filters.kind}
        aria-label="Abstraction"
        onchange={(event) => filter('kind', event.currentTarget.value)}
      >
        {#each kinds as kind (kind)}<option value={kind}>{kind === 'all' ? 'Any' : kind}</option
          >{/each}
      </select>
    </ToolGroup>
    <ToolGroup caption="Mapping usage">
      <select
        value={filters.usage}
        aria-label="Mapping usage"
        onchange={(event) => filter('usage', event.currentTarget.value)}
      >
        {#each usages as usage (usage)}
          <option value={usage}>{usage === 'any' ? 'Any' : usage.replaceAll('-', ' ')}</option>
        {/each}
      </select>
    </ToolGroup>
    <ToolGroup caption="Status">
      <label class="check">
        <input
          type="checkbox"
          checked={filters.hideRetired}
          onchange={(event) => keep({ deprecated: event.currentTarget.checked ? null : '1' })}
        /> Hide deprecated
      </label>
    </ToolGroup>
    <ToolGroup caption="Catalogue">
      <span class="release">CWE {data.version}, {formatDate(data.date)}</span>
    </ToolGroup>
  </Toolbar>

  {#if index?.status === 'failed'}
    <SourceState source="The search index" outcome={index} retry={loadIndex} />
  {/if}

  <p class="count" aria-live="polite">
    {#if live && !index}
      Loading the search index...
    {:else if hits && results.length}
      {plural(results.length, 'match', 'matches')}, {inView} in {view.label}.
    {:else if hits && !problem && matched.length}
      {plural(matched.length, 'match', 'matches')}, all hidden by the filters.
    {:else if hits && !problem}
      Nothing matches that. Try fewer words, or a common term like XSS, SQLi or SSRF.
    {/if}
  </p>

  {#if hits && results.length}
    {#key live}<Results {results} />{/key}
  {/if}

  <section class="browse" aria-labelledby="view-title">
    <header>
      <h2 id="view-title">{view.name}</h2>
      <p>{view.objective}</p>
    </header>
    <Matrix {view} cells={data.cells} {hits} {filters} />
  </section>
</ToolPage>

{#snippet guide()}<Guide />{/snippet}

<style>
  .check {
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    min-height: var(--control);
    font-size: var(--text-sm);

    & input {
      min-height: auto;
    }
  }

  .release {
    display: inline-flex;
    align-items: center;
    min-height: var(--control);
    font-family: var(--font-mono);
    font-size: var(--text-xs);
  }

  .count {
    min-height: 1.2em;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .browse {
    display: grid;
    gap: var(--space-2);
    margin-top: var(--space-3);

    & header {
      display: grid;
      gap: var(--space-1);
    }

    & h2 {
      font-size: var(--text-md);
    }

    & p {
      max-width: var(--measure);
      color: var(--text-muted);
      font-size: var(--text-sm);
    }
  }
</style>
