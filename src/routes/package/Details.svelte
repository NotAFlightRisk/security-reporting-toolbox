<script lang="ts">
  import CopyButton from '#lib/components/CopyButton.svelte';
  import Interchange from '#lib/components/Interchange.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import type { Ecosystem } from '#lib/ecosystems.ts';
  import { formatDate, plural } from '#lib/format.ts';
  import { purlFor } from '#lib/packages/identify.ts';
  import { details, lookup, type Lookup, type PackageInfo } from '#lib/packages/registry.ts';

  let {
    ecosystem,
    name,
    version,
    via
  }: { ecosystem: Ecosystem; name: string; version?: string; via: string } = $props();

  let result = $state<Lookup>();
  let info = $state<PackageInfo>();
  let gap = $state<string>();
  let attempt = $state(0);
  let showAll = $state(false);
  const shown = 20;

  $effect(() => {
    void attempt;
    result = undefined;
    gap = undefined;
    lookup(ecosystem, name).then(async (answer) => {
      result = answer;
      if (answer.status !== 'ok') return;
      const enriched = await details(ecosystem, answer.data);
      info = enriched.info;
      gap = enriched.gap;
    });
  });

  const problem = $derived(ecosystem.check(name));
  const canonical = $derived(info?.name ?? name);
  const purl = $derived(purlFor(ecosystem, canonical));
  const pinned = $derived(version ?? info?.latest);
  const pinnedPurl = $derived(pinned ? purlFor(ecosystem, canonical, pinned) : null);
  const latest = $derived(info?.releases.find((release) => release.version === info?.latest));
  const releases = $derived(info ? (showAll ? info.releases : info.releases.slice(0, shown)) : []);
  const advisories = $derived(
    `https://github.com/advisories?query=${encodeURIComponent(`ecosystem:${ecosystem.id} ${canonical}`)}`
  );
  const osv = $derived(
    `https://osv.dev/list?ecosystem=${encodeURIComponent(ecosystem.osv)}&q=${encodeURIComponent(canonical)}`
  );
  const source = $derived(
    ecosystem.depsDev ? 'deps.dev' : ecosystem.registry === 'pub' ? 'pub.dev' : 'hex.pm'
  );
</script>

<article class="details">
  <header>
    <h2><code>{canonical}</code></h2>
    <p class="via">{ecosystem.name} package{via ? `, going by the ${via}` : ''}</p>
  </header>

  {#if problem}
    <p class="problem {problem.level}" role="status">{problem.message}</p>
  {/if}

  <dl class="facts">
    {#if purl}
      <dt>Package URL</dt>
      <dd class="copyable"><code>{purl}</code><CopyButton text={purl} compact /></dd>
    {/if}
    {#if pinnedPurl && pinnedPurl !== purl}
      <dt>Pinned to {pinned}</dt>
      <dd class="copyable"><code>{pinnedPurl}</code><CopyButton text={pinnedPurl} compact /></dd>
    {/if}
    {#if info}
      {#if info.latest}
        <dt>Latest</dt>
        <dd>
          <code>{info.latest}</code>{#if latest?.published}, released {formatDate(
              latest.published
            )}{/if}
        </dd>
      {/if}
      {#if info.licenses}
        <dt>Licence</dt>
        <dd>{info.licenses.join(', ') || 'None declared'}</dd>
      {/if}
      {#if info.repo}
        <dt>Repository</dt>
        <dd><a href={info.repo} rel="external">{info.repo.replace(/^https?:\/\//, '')}</a></dd>
      {:else if !gap}
        <dt>Repository</dt>
        <dd>None listed</dd>
      {/if}
      {#if info.homepage && info.homepage !== info.repo}
        <dt>Homepage</dt>
        <dd>
          <a href={info.homepage} rel="external">{info.homepage.replace(/^https?:\/\//, '')}</a>
        </dd>
      {/if}
    {/if}
    <dt>Registry</dt>
    <dd>
      <a href={ecosystem.page(canonical)} rel="external"
        >{ecosystem.page(canonical).replace(/^https?:\/\//, '')}</a
      >
    </dd>
  </dl>

  {#if gap}
    <p class="problem" role="status">
      {gap}
      <button type="button" class="button" onclick={() => attempt++}>Try again</button>
    </p>
  {/if}

  <Interchange
    links={[
      {
        href: `/versions?ecosystem=${ecosystem.id}&package=${encodeURIComponent(canonical)}`,
        label: 'Version range builder'
      }
    ]}
  />
  <p class="external">
    Advisories for it on <a href={advisories} rel="external">GitHub</a> and
    <a href={osv} rel="external">OSV</a>
  </p>

  {#if result?.status === 'unsupported'}
    <p class="note">{result.reason}</p>
  {:else if result?.status !== 'ok'}
    <SourceState
      {source}
      outcome={result}
      missing="doesn't know a {ecosystem.name} package called {name}, so check the spelling"
      retry={() => attempt++}
    />
  {:else if info}
    <section class="releases" aria-label="Releases">
      <h3 class="label">{plural(info.releases.length, 'release')}, newest first</h3>
      <table>
        <thead
          ><tr
            ><th scope="col">Version</th><th scope="col">Released</th><th scope="col">Notes</th></tr
          ></thead
        >
        <tbody>
          {#each releases as release (release.version)}
            <tr>
              <td><code>{release.version}</code></td>
              <td>{formatDate(release.published) || 'Unknown'}</td>
              <td>
                {[
                  release.version === info.latest && 'latest',
                  release.deprecated && 'deprecated',
                  release.pulled
                ]
                  .filter(Boolean)
                  .join(', ')}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
      {#if info.releases.length > shown}
        <button type="button" class="button" onclick={() => (showAll = !showAll)}>
          {showAll
            ? `Just the newest ${shown}`
            : `Show all ${plural(info.releases.length, 'release')}`}
        </button>
      {/if}
      <p class="note">From <a href={info.source.url} rel="external">{info.source.name}</a>.</p>
    </section>
  {/if}
</article>

<style>
  .details {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-4);
    border: var(--hairline) solid var(--line);
    background: var(--surface);

    & h2 {
      font-size: var(--text-lg);
      overflow-wrap: anywhere;
    }
  }

  .via,
  .note,
  .external {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .problem {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-1) var(--space-2);
    border: var(--hairline) solid var(--warn);
    background: var(--warn-soft);
    font-size: var(--text-sm);

    &.error {
      border-color: var(--bad);
      background: var(--bad-soft);
    }
  }

  .facts {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-4);
    margin: 0;
    font-size: var(--text-sm);

    & dt {
      color: var(--text-muted);
    }

    & dd {
      margin: 0;
      min-width: 0;
      overflow-wrap: anywhere;
    }
  }

  .copyable {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  .releases {
    display: grid;
    justify-items: start;
    gap: var(--space-2);
    max-width: 100%;
    overflow-x: auto;
  }

  table {
    border-collapse: collapse;
    font-size: var(--text-sm);

    & th,
    & td {
      padding: var(--space-1) var(--space-3) var(--space-1) 0;
      border-bottom: var(--hairline) solid var(--line);
      text-align: start;
    }

    & th {
      color: var(--text-muted);
      font-size: var(--text-xs);
      font-weight: 600;
    }
  }

  @media (max-width: 30rem) {
    .facts {
      grid-template-columns: 1fr;

      & dd {
        margin-bottom: var(--space-2);
      }
    }
  }
</style>
