<script lang="ts">
  import CopyButton from '#lib/components/CopyButton.svelte';
  import Interchange from '#lib/components/Interchange.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import Stamp from '#lib/components/Stamp.svelte';
  import { formatDate, percent } from '#lib/format.ts';
  import type { Lookup } from '#lib/sources/lookup.svelte.ts';
  import { groupReferences } from '#lib/sources/references.ts';
  import { aliases, allReferences, mergeWeaknesses, type Sources } from '#lib/sources/summary.ts';
  import Scores, { type Column } from './Scores.svelte';

  let { lookup }: { lookup: Lookup } = $props();

  const ok = <T,>(outcome: { status: string; data?: T } | undefined) =>
    outcome?.status === 'ok' ? (outcome.data as T) : null;

  const sources: Sources = $derived({
    record: ok(lookup.record),
    nvd: ok(lookup.nvd),
    advisories: ok(lookup.github) ?? [],
    osv: ok(lookup.osv)
  });
  const record = $derived(sources.record);
  const nvd = $derived(sources.nvd);
  const advisory = $derived(sources.advisories[0]);
  const epss = $derived(ok(lookup.epss));
  const cisa = $derived(record?.adp.find((adp) => adp.name === 'CISA-ADP'));

  const title = $derived(record?.title || advisory?.summary || '');
  const description = $derived(record?.description || nvd?.description || advisory?.description);
  const published = $derived(record?.published || nvd?.published || advisory?.published);
  const updated = $derived(record?.updated || nvd?.updated || advisory?.updated);
  const otherIds = $derived(aliases(lookup.id, sources));
  const weaknesses = $derived(mergeWeaknesses(sources));
  const references = $derived(groupReferences(allReferences(sources)));
  // the big ones have hundreds, so each group shows a handful and folds the rest
  const shownRefs = 8;
  const kevAdded = $derived(nvd?.kev?.added ?? cisa?.kevAdded ?? null);
  const pending = (outcome: unknown) => outcome === undefined;

  const cveColumns: Column[] = $derived([
    {
      name: record ? `CNA (${record.cna.name})` : 'CNA',
      scores: pending(lookup.record) ? undefined : (record?.cna.scores ?? [])
    },
    ...(record?.adp ?? [])
      .filter((adp) => adp.scores.length)
      .map((adp) => ({ name: adp.name, scores: adp.scores })),
    {
      name: 'NVD',
      note: nvd?.status ? `Status: ${nvd.status}` : undefined,
      scores: pending(lookup.nvd)
        ? undefined
        : (nvd?.scores.filter((score) => score.source === 'NVD') ?? [])
    }
  ]);
  const githubColumns: Column[] = $derived(
    sources.advisories.length
      ? sources.advisories.map((item) => ({ name: `GitHub ${item.ghsa}`, scores: item.scores }))
      : [
          {
            name: 'GitHub',
            note: lookup.github?.status === 'missing' ? 'No advisory' : undefined,
            scores: pending(lookup.github) ? undefined : []
          }
        ]
  );
  const columns = $derived(lookup.cve ? [...cveColumns, ...githubColumns] : githubColumns);

  const firstVector = $derived(columns.flatMap((column) => column.scores ?? [])[0]?.vector);
  const links = $derived(
    [
      firstVector && { href: `/cvss?vector=${encodeURIComponent(firstVector)}`, label: 'CVSS' },
      lookup.cve && { href: `/epss?cve=${lookup.cve}`, label: 'EPSS' },
      lookup.cve && { href: `/kev?cve=${lookup.cve}`, label: 'KEV' },
      weaknesses[0]?.id && { href: `/cwe/${weaknesses[0].id}`, label: `CWE-${weaknesses[0].id}` },
      advisory?.packages[0] && {
        href: `/versions?ecosystem=${advisory.packages[0].ecosystem}&package=${encodeURIComponent(advisory.packages[0].name)}`,
        label: 'Versions'
      }
    ].filter((link): link is { href: string; label: string } => Boolean(link))
  );

  const retry = () => lookup.run();
  const idLink = (id: string) =>
    /^(CVE|GHSA)-/i.test(id) ? `/cve?id=${id}` : `https://osv.dev/vulnerability/${id}`;
</script>

<article class="record">
  <header class="title">
    <div class="id">
      <h2><code>{lookup.id}</code></h2>
      <CopyButton text={lookup.id} label="Copy ID" compact />
      {#if record?.state === 'REJECTED'}<Stamp word="Rejected" title="Rejected by CVE.org" />{/if}
      {#if advisory?.withdrawn}
        <Stamp
          word="Withdrawn"
          title="GitHub withdrew this advisory on {formatDate(advisory.withdrawn)}"
        />
      {/if}
    </div>
    {#if title}<p class="name">{title}</p>{/if}
    <dl class="facts">
      {#if published}<div>
          <dt>Published</dt>
          <dd>{formatDate(published)}</dd>
        </div>{/if}
      {#if updated}<div>
          <dt>Updated</dt>
          <dd>{formatDate(updated)}</dd>
        </div>{/if}
      {#if record?.assigner}<div>
          <dt>Assigned by</dt>
          <dd>{record.assigner}</dd>
        </div>{/if}
    </dl>
    {#if otherIds.length}
      <p class="aliases">
        <span class="label">Also known as</span>
        {#each otherIds as alias (alias)}
          <a href={idLink(alias)} rel={alias.match(/^(CVE|GHSA)-/i) ? undefined : 'external'}>
            <code>{alias}</code>
          </a>
        {/each}
      </p>
    {/if}
    <Interchange {links} />
  </header>

  <div class="states">
    <SourceState
      source="GitHub"
      outcome={lookup.github}
      missing="has no advisory for this"
      {retry}
    />
    {#if lookup.cve}
      <SourceState
        source="CVE.org"
        outcome={lookup.record}
        missing="has no record of this CVE"
        {retry}
      />
      <SourceState source="NVD" outcome={lookup.nvd} missing="hasn't published this CVE" {retry} />
    {:else if lookup.github?.status === 'ok'}
      <p class="note">This advisory has no CVE, so there's nothing to ask CVE.org or NVD.</p>
    {/if}
    <SourceState source="OSV" outcome={lookup.osv} missing="has no entry under this ID" {retry} />
  </div>

  {#if record?.state === 'REJECTED'}
    <p class="rejected">{record.rejectedReason || 'CVE.org rejected this ID.'}</p>
  {:else if description}
    <p class="description">{description}</p>
  {/if}

  <section aria-labelledby="scores">
    <h3 id="scores">Scores</h3>
    <Scores {columns} />
    {#if nvd?.status && /awaiting|undergoing|received|deferred/i.test(nvd.status)}
      <p class="note">
        NVD lists this as "{nvd.status}", so it hasn't scored it yet. The CNA's score is the one to
        quote for now.
      </p>
    {/if}
  </section>

  {#if lookup.cve}
    <section aria-labelledby="exploitation">
      <h3 id="exploitation">Exploitation</h3>
      <div class="matrix exploit">
        <div class="column">
          <div class="column-head">EPSS <small>FIRST, next 30 days</small></div>
          {#if lookup.epss?.status === 'failed'}
            <span class="cell dim">EPSS {lookup.epss.message}</span>
          {:else if !lookup.epss}
            <span class="cell dim">Waiting...</span>
          {:else if epss}
            <a class="cell" href="/epss?cve={lookup.cve}">
              <span><b class="figure">{percent(epss.probability)}</b> chance</span>
              <span><b class="figure">{percent(epss.percentile, 1)}</b> percentile</span>
              <small>as of {formatDate(epss.date)}</small>
            </a>
          {:else}
            <span class="cell dim">No EPSS score (too new, rejected, or not scored)</span>
          {/if}
        </div>
        <div class="column">
          <div class="column-head">KEV <small>CISA known exploited</small></div>
          {#if kevAdded}
            <a class="cell" href="/kev?cve={lookup.cve}">
              <b>In KEV</b> since {formatDate(kevAdded)}
              {#if nvd?.kev?.due}<small>Due {formatDate(nvd.kev.due)}</small>{/if}
            </a>
          {:else if pending(lookup.nvd) || pending(lookup.record)}
            <span class="cell dim">Waiting...</span>
          {:else}
            <a class="cell" href="/kev?cve={lookup.cve}">
              Not listed by NVD or CISA-ADP
              <small>Check the catalogue itself</small>
            </a>
          {/if}
        </div>
        {#if cisa?.ssvc}
          <div class="column">
            <div class="column-head">SSVC <small>CISA's triage call</small></div>
            <dl class="cell ssvc">
              <dt>Exploitation</dt>
              <dd>{cisa.ssvc.exploitation || 'not given'}</dd>
              <dt>Automatable</dt>
              <dd>{cisa.ssvc.automatable || 'not given'}</dd>
              <dt>Technical impact</dt>
              <dd>{cisa.ssvc.impact || 'not given'}</dd>
            </dl>
          </div>
        {/if}
      </div>
    </section>
  {/if}

  {#if weaknesses.length}
    <section aria-labelledby="weaknesses">
      <h3 id="weaknesses">Weaknesses</h3>
      <div class="scroll">
        <table>
          <thead
            ><tr><th scope="col">CWE</th><th scope="col">Name</th><th scope="col">Said by</th></tr
            ></thead
          >
          <tbody>
            {#each weaknesses as item (item.id ?? item.text)}
              <tr>
                <td
                  >{#if item.id !== null}<a href="/cwe/{item.id}"><code>CWE-{item.id}</code></a
                    >{:else}-{/if}</td
                >
                <td>{item.text || 'No name given'}</td>
                <td>{item.sources.join(', ')}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </section>
  {/if}

  {#if sources.advisories.some((item) => item.packages.length) || record?.affected.length}
    <section aria-labelledby="affected">
      <h3 id="affected">Affected</h3>
      {#each sources.advisories.filter((item) => item.packages.length) as item (item.ghsa)}
        <div class="scroll">
          <table>
            <caption>Packages, from <a href={item.url} rel="external">{item.ghsa}</a></caption>
            <thead>
              <tr>
                <th scope="col">Ecosystem</th><th scope="col">Package</th>
                <th scope="col">Vulnerable</th><th scope="col">Patched</th>
              </tr>
            </thead>
            <tbody>
              {#each item.packages as pkg, index (index)}
                {@const name = encodeURIComponent(pkg.name)}
                <tr>
                  <td>{pkg.ecosystem}</td>
                  <td
                    ><a href="/package?ecosystem={pkg.ecosystem}&q={name}"
                      ><code>{pkg.name}</code></a
                    ></td
                  >
                  <td>
                    <a href="/versions?ecosystem={pkg.ecosystem}&package={name}"
                      ><code>{pkg.range || 'unspecified'}</code></a
                    >
                  </td>
                  <td
                    >{#if pkg.patched}<code>{pkg.patched}</code>{:else}<span class="dim"
                        >No fix listed</span
                      >{/if}</td
                  >
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/each}
      {#if record?.affected.length}
        <div class="scroll">
          <table>
            <caption>Products, from the CNA</caption>
            <thead>
              <tr>
                <th scope="col">Vendor</th>
                <th scope="col">Product</th>
                <th scope="col">Versions</th>
              </tr>
            </thead>
            <tbody>
              {#each record.affected as product, index (index)}
                <tr>
                  <td>{product.vendor}</td>
                  <td>{product.product}</td>
                  <td>
                    <ul class="versions">
                      {#each product.versions as version, row (row)}
                        <li class={version.status}><code>{version.text}</code> {version.status}</li>
                      {:else}
                        <li class="dim">No versions given</li>
                      {/each}
                      {#if product.defaultStatus}
                        <li class={product.defaultStatus}>
                          Every other version: <b>{product.defaultStatus}</b>
                        </li>
                      {/if}
                    </ul>
                  </td>
                </tr>
              {/each}
            </tbody>
          </table>
        </div>
      {/if}
    </section>
  {/if}

  {#snippet refItems(list: (typeof references)[number]['references'])}
    {#each list as ref (ref.url)}
      <li><a href={ref.url} rel="external noreferrer">{ref.name || ref.url}</a></li>
    {/each}
  {/snippet}

  {#if references.length}
    <section aria-labelledby="references">
      <h3 id="references">References</h3>
      <div class="refs">
        {#each references as group (group.name)}
          <div>
            <h4>{group.name} <small>{group.references.length}</small></h4>
            <ul>{@render refItems(group.references.slice(0, shownRefs))}</ul>
            {#if group.references.length > shownRefs}
              <details>
                <summary>{group.references.length - shownRefs} more</summary>
                <ul>{@render refItems(group.references.slice(shownRefs))}</ul>
              </details>
            {/if}
          </div>
        {/each}
      </div>
    </section>
  {/if}
</article>

<style>
  .record {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-5);

    & h3 {
      margin-bottom: var(--space-2);
      font-size: var(--text-md);
    }
  }

  .title {
    display: grid;
    gap: var(--space-2);
  }

  .id {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2) var(--space-3);

    & h2 {
      font-size: var(--text-lg);
    }
  }

  .name {
    font-size: var(--text-md);
    font-weight: 600;
  }

  .facts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-5);
    margin: 0;
    font-size: var(--text-sm);

    & div {
      display: flex;
      gap: var(--space-1);
    }

    & dt {
      color: var(--text-muted);
    }

    & dd {
      margin: 0;
    }
  }

  .aliases {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-3);
    font-size: var(--text-sm);
  }

  .states {
    display: grid;
    gap: var(--space-1);

    &:empty {
      display: none;
    }
  }

  .description,
  .rejected {
    max-width: var(--measure);
    white-space: pre-line;
  }

  .rejected {
    color: var(--bad);
  }

  .note {
    max-width: var(--measure);
    margin-top: var(--space-2);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .exploit {
    --column: 15rem;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, var(--column)), 1fr));

    & .figure {
      font-family: var(--font-mono);
      font-size: var(--text-md);
    }

    & .ssvc {
      grid-template-columns: max-content 1fr;
      gap: 2px var(--space-3);
      margin: 0;

      & dt {
        color: var(--text-muted);
      }

      & dd {
        margin: 0;
        font-weight: 650;
      }
    }

    & .cell {
      display: grid;
      gap: 2px;
      padding-block: var(--space-2);
    }

    & small {
      color: var(--text-muted);
    }
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    font-size: var(--text-sm);

    & caption {
      padding-block: var(--space-1);
      color: var(--text-muted);
      text-align: start;
    }

    & :is(th, td) {
      padding: var(--space-1) var(--space-2);
      border: var(--hairline) solid var(--line);
      text-align: start;
      vertical-align: top;
    }

    & th {
      background: var(--surface-raised);
      font-weight: 650;
    }
  }

  .versions {
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;

    & .unaffected {
      color: var(--good);
    }
  }

  .dim {
    color: var(--text-faint);
  }

  .refs {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 18rem), 1fr));
    gap: var(--space-4);

    & details {
      margin-top: var(--space-1);
      font-size: var(--text-sm);
    }

    & summary {
      color: var(--accent);
      cursor: pointer;
    }

    & h4 {
      margin-bottom: var(--space-1);
      font-size: var(--text-sm);

      & small {
        color: var(--text-muted);
        font-weight: 450;
      }
    }

    & ul {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding-left: var(--space-4);
      font-size: var(--text-sm);
      overflow-wrap: anywhere;
    }
  }
</style>
