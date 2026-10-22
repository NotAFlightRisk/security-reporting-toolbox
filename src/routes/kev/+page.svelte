<script lang="ts">
  import { onMount, untrack } from 'svelte';
  import QueryField from '#lib/components/QueryField.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import ToolGroup from '#lib/components/ToolGroup.svelte';
  import Toolbar from '#lib/components/Toolbar.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { formatDate, plural } from '#lib/format.ts';
  import { cveIds } from '#lib/ids.ts';
  import type { Outcome } from '#lib/net/fetch.ts';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { crossCheck, filterKev, loadKev, type KevCatalogue } from '#lib/sources/kev.ts';
  import { lookupNvd, type NvdCve } from '#lib/sources/nvd.ts';
  import { tool } from '#lib/tools.ts';
  import Entry from './Entry.svelte';
  import Guide from './Guide.svelte';

  const perPage = 50;
  // NVD allows 5 requests per 30 seconds, so only cross-check a handful
  const crossCheckLimit = 5;
  const windows = [0, 30, 90, 365];

  const asked = $derived(cveIds(param('cve')));
  const text = $derived(param('q'));
  const ransomware = $derived(param('ransomware') === '1');
  const days = $derived(windows.includes(Number(param('days'))) ? Number(param('days')) : 0);
  const page = $derived(Math.max(0, Number(param('page')) || 0));

  let input = $state('');
  let catalogue = $state<Outcome<KevCatalogue>>();
  let nvd = $state<Record<string, Outcome<NvdCve> | undefined>>({});

  $effect(() => {
    input = asked.length ? asked.join(', ') : text;
  });

  const load = () => {
    catalogue = undefined;
    loadKev().then((outcome) => (catalogue = outcome));
  };
  onMount(load);

  const data = $derived(catalogue?.status === 'ok' ? catalogue.data : null);
  const checked = $derived(asked.map((cve) => ({ cve, entry: data?.byCve.get(cve) ?? null })));
  const absent = $derived(data ? checked.filter((row) => !row.entry).map((row) => row.cve) : []);

  $effect(() => {
    const missing = absent;
    untrack(() => {
      nvd = {};
      if (missing.length > crossCheckLimit) return;
      for (const cve of missing)
        lookupNvd(cve).then((outcome) => (nvd = { ...nvd, [cve]: outcome }));
    });
  });

  const matches = $derived(data ? filterKev(data.entries, { text, ransomware, days }) : []);
  const pages = $derived(Math.ceil(matches.length / perPage));
  const shown = $derived(matches.slice(page * perPage, (page + 1) * perPage));

  function submit(value: string) {
    const found = cveIds(value);
    setParams(
      found.length
        ? { cve: found.join(','), q: null, page: null }
        : { q: value || null, cve: null, page: null }
    );
  }

  const filter = (values: Record<string, string | null>) =>
    setParams({ ...values, page: null }, { replace: true });
</script>

<ToolPage tool={tool('kev')}>
  <QueryField
    bind:value={input}
    label="CVE IDs to check, or words to search the catalogue"
    placeholder="CVE-2023-4863, or ivanti, or chrome webp"
    hint="Any CVE IDs in what you paste get checked. Anything else searches vendor, product and description."
    multiline
    button="Check"
    onsubmit={submit}
  />

  <SourceState source="CISA's KEV feed on GitHub" outcome={catalogue} retry={load} />

  {#if data}
    <p class="freshness">
      Catalogue <b class="mono">{data.version}</b>, released {formatDate(data.released)} with
      {plural(data.entries.length, 'entry', 'entries')}. This copy comes from CISA's GitHub mirror,
      which runs about a day behind cisa.gov.
    </p>

    {#if asked.length}
      <section class="checks" aria-label="Check results">
        {#each checked as { cve, entry } (cve)}
          {#if entry}
            <Entry {entry} />
          {:else}
            {@const cross = nvd[cve] && crossCheck(nvd[cve])}
            <article class="absent panel">
              <p>
                <span class="verdict">Not in KEV</span>
                <a href="/cve?id={cve}"><code>{cve}</code></a> isn't in catalogue {data.version}.
              </p>
              {#if absent.length > crossCheckLimit}
                <p class="dim">
                  Too many to double-check with NVD at once (it allows 5 requests per 30 seconds).
                  Check this one on its own if it was disclosed in the last day or two.
                </p>
              {:else if !cross}
                <p class="dim">Double-checking with NVD for anything added since...</p>
              {:else if cross.kind === 'listed'}
                <p class="newer">
                  But NVD says CISA added it on {formatDate(cross.kev.added)}, due
                  {formatDate(cross.kev.due)}. That's newer than this copy of the catalogue, so
                  treat it as in KEV.
                </p>
              {:else if cross.kind === 'agrees'}
                <p class="dim">NVD agrees, it has no KEV date for it either.</p>
              {:else if cross.kind === 'unknown'}
                <p class="dim">
                  NVD has no record of this CVE, so it couldn't confirm either way. If it's brand
                  new, check back in a day.
                </p>
              {:else}
                <p class="dim">Couldn't double-check with NVD: it {cross.message}.</p>
              {/if}
            </article>
          {/if}
        {/each}
        <p><a href="/kev">Browse the whole catalogue</a></p>
      </section>
    {:else}
      <Toolbar label="Filter the catalogue">
        <ToolGroup caption="Ransomware">
          <div class="segments">
            <button
              type="button"
              class="cell"
              aria-pressed={ransomware}
              onclick={() => filter({ ransomware: ransomware ? null : '1' })}
            >
              Known use only
            </button>
          </div>
        </ToolGroup>
        <ToolGroup caption="Added in the last">
          <div class="segments">
            {#each windows as window (window)}
              <button
                type="button"
                class="cell"
                aria-pressed={days === window}
                onclick={() => filter({ days: window ? String(window) : null })}
              >
                {window ? `${window} days` : 'Any time'}
              </button>
            {/each}
          </div>
        </ToolGroup>
      </Toolbar>

      <p class="tally" role="status">
        {plural(matches.length, 'entry', 'entries')}{text ? ` matching "${text}"` : ''}, newest
        first
      </p>

      {#if shown.length}
        <div class="scroll">
          <table>
            <thead>
              <tr>
                <th scope="col">CVE</th>
                <th scope="col">Vendor and product</th>
                <th scope="col">Vulnerability</th>
                <th scope="col">Added</th>
                <th scope="col">Due</th>
                <th scope="col">Ransomware</th>
              </tr>
            </thead>
            <tbody>
              {#each shown as entry (entry.cve)}
                <tr>
                  <th scope="row"><a href="/kev?cve={entry.cve}"><code>{entry.cve}</code></a></th>
                  <td>{entry.vendor} {entry.product}</td>
                  <td>{entry.name}</td>
                  <td class="nowrap">{formatDate(entry.added)}</td>
                  <td class="nowrap">{formatDate(entry.due)}</td>
                  <td>{entry.ransomware ? 'Known' : 'Unknown'}</td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
        {#if pages > 1}
          <nav class="pager" aria-label="Catalogue pages">
            <button
              type="button"
              class="button"
              disabled={page === 0}
              onclick={() => setParams({ page: page > 1 ? String(page - 1) : null })}
            >
              Newer
            </button>
            <span>Page {page + 1} of {pages}</span>
            <button
              type="button"
              class="button"
              disabled={page + 1 >= pages}
              onclick={() => setParams({ page: String(page + 1) })}
            >
              Older
            </button>
          </nav>
        {/if}
      {:else}
        <p class="dim">
          Nothing in the catalogue matches that. Try fewer words or a wider date range.
        </p>
      {/if}
    {/if}
  {/if}

  {#snippet guide()}<Guide />{/snippet}
</ToolPage>

<style>
  .freshness {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .checks {
    display: grid;
    gap: var(--space-3);
  }

  .absent {
    display: grid;
    gap: var(--space-1);
    padding: var(--space-3) var(--space-4);
    border-color: var(--good);
    background: var(--good-soft);
  }

  .verdict {
    margin-right: var(--space-2);
    padding: 1px var(--space-2);
    border-radius: 3px;
    background: var(--good);
    color: var(--surface);
    font-size: var(--text-xs);
    font-weight: 750;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .newer {
    color: var(--bad);
    font-weight: 600;
  }

  .dim {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .tally {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .pager {
    display: flex;
    align-items: center;
    gap: var(--space-2);
    font-size: var(--text-sm);
  }
</style>
