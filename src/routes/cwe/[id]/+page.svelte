<script lang="ts">
  import CopyButton from '#lib/components/CopyButton.svelte';
  import Interchange from '#lib/components/Interchange.svelte';
  import Seo from '#lib/components/Seo.svelte';
  import Stamp from '#lib/components/Stamp.svelte';
  import { groupRelated } from '#lib/cwe/related.ts';
  import Linked from '#lib/cwe/Linked.svelte';
  import Prose from '#lib/cwe/Prose.svelte';
  import { retired } from '#lib/cwe/search.ts';
  import { summarise, usageNote } from '#lib/cwe/text.ts';
  import UsageTag from '#lib/cwe/UsageTag.svelte';
  import { cveId } from '#lib/ids.ts';
  import { formatDate } from '#lib/format.ts';
  import { absolute } from '#lib/site.ts';

  let { data } = $props();

  const entry = $derived(data.weakness ?? data.category!);
  const weakness = $derived(data.weakness);
  const label = $derived(`CWE-${entry.id}`);
  const full = $derived(`${label}: ${entry.name}`);
  const about = $derived(
    weakness
      ? weakness.description
      : data.category!.summary.filter((block) => typeof block === 'string').join(' ')
  );
  const related = $derived(weakness ? groupRelated(weakness) : []);
  const mitre = $derived(`https://cwe.mitre.org/data/definitions/${entry.id}.html`);

  const term = $derived({
    '@type': 'DefinedTerm',
    '@id': absolute(`/cwe/${entry.id}#term`),
    name: full,
    termCode: label,
    description: about,
    url: absolute(`/cwe/${entry.id}`),
    sameAs: mitre,
    inDefinedTermSet: {
      '@type': 'DefinedTermSet',
      '@id': absolute('/cwe#set'),
      name: 'Common Weakness Enumeration (CWE)',
      url: 'https://cwe.mitre.org/'
    }
  });
</script>

<Seo
  title={full}
  description={summarise(about, 155)}
  path="/cwe/{entry.id}"
  crumbs={[
    { name: 'CWE explorer', path: '/cwe' },
    { name: label, path: `/cwe/${entry.id}` }
  ]}
  schema={[term]}
/>

{#snippet links(ids: number[])}
  <ul class="links">
    {#each ids as id (id)}
      <li><a href="/cwe/{id}"><span class="mono">CWE-{id}</span> {data.names[id] ?? ''}</a></li>
    {/each}
  </ul>
{/snippet}

<nav class="crumbs" aria-label="Breadcrumb">
  <a href="/cwe">CWE explorer</a> <span aria-hidden="true">/</span> <span>{label}</span>
</nav>

<header class="head">
  <h1><span class="mono id">{label}</span> {entry.name}</h1>
  <div class="actions">
    {#if retired(entry)}<Stamp word={entry.status} />{/if}
    <CopyButton text={label} label="Copy ID" />
    <CopyButton text={full} label="Copy ID and name" />
    <a class="button" href={mitre} rel="external">On cwe.mitre.org</a>
  </div>
</header>

<dl class="facts">
  <div>
    <dt>Type</dt>
    <dd>{weakness?.abstraction ?? 'Category'}</dd>
  </div>
  <div>
    <dt>Status</dt>
    <dd>{entry.status}</dd>
  </div>
  {#if entry.mapping}
    <div>
      <dt>Mapping</dt>
      <dd><UsageTag usage={entry.mapping.usage} /></dd>
    </div>
  {/if}
  {#if weakness?.likelihood}
    <div>
      <dt>Likelihood of exploit</dt>
      <dd>{weakness.likelihood}</dd>
    </div>
  {/if}
  <div>
    <dt>Catalogue</dt>
    <dd class="mono">CWE {data.version}, {formatDate(data.date)}</dd>
  </div>
</dl>

<div class="layout">
  <div class="main">
    {#if entry.mapping}
      <section class="panel mapping">
        <h2>Should you map to this?</h2>
        <p class="verdict">
          <UsageTag usage={entry.mapping.usage} />
          {usageNote(entry.mapping.usage)}.
        </p>
        {#if entry.mapping.rationale}<p>
            <Linked text={entry.mapping.rationale} names={data.names} />
          </p>{/if}
        {#if entry.mapping.comments}<p>
            <Linked text={entry.mapping.comments} names={data.names} />
          </p>{/if}
        {#if entry.mapping.suggestions.length}
          <h3>MITRE suggests instead</h3>
          <ul class="links">
            {#each entry.mapping.suggestions as { id, comment } (id)}
              <li>
                <a href="/cwe/{id}"><span class="mono">CWE-{id}</span> {data.names[id] ?? ''}</a>
                <span class="muted">{comment}</span>
              </li>
            {/each}
          </ul>
        {/if}
      </section>
    {/if}

    {#if weakness}
      <section>
        <h2>Description</h2>
        <p><Linked text={weakness.description} names={data.names} /></p>
        <Prose blocks={weakness.extended} names={data.names} />
      </section>

      {#if weakness.terms.length}
        <section>
          <h2>Also known as</h2>
          <dl class="terms">
            {#each weakness.terms as { term, description }, index (index)}
              <div>
                <dt>{term}</dt>
                <dd>{description}</dd>
              </div>
            {/each}
          </dl>
        </section>
      {/if}

      {#if weakness.consequences.length}
        <section>
          <h2>Common consequences</h2>
          <div class="scroll">
            <table>
              <thead
                ><tr
                  ><th scope="col">Scope</th><th scope="col">Impact</th><th scope="col">Notes</th
                  ></tr
                ></thead
              >
              <tbody>
                {#each weakness.consequences as { scopes, impacts, note }, index (index)}
                  <tr><td>{scopes.join(', ')}</td><td>{impacts.join(', ')}</td><td>{note}</td></tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}

      {#if weakness.mitigations.length}
        <section>
          <h2>Mitigations</h2>
          <ol class="mitigations">
            {#each weakness.mitigations as mitigation, index (index)}
              <li>
                <p class="label">
                  {[mitigation.phases.join(', '), mitigation.strategy].filter(Boolean).join(' - ')}
                </p>
                <Prose blocks={mitigation.description} names={data.names} />
                {#if mitigation.effectiveness}
                  <p class="muted">Effectiveness: {mitigation.effectiveness}</p>
                {/if}
              </li>
            {/each}
          </ol>
        </section>
      {/if}

      {#if weakness.examples.length}
        <section>
          <h2>Observed examples</h2>
          <div class="scroll">
            <table>
              <thead
                ><tr><th scope="col">Reference</th><th scope="col">What happened</th></tr></thead
              >
              <tbody>
                {#each weakness.examples as { ref, description }, index (index)}
                  {@const cve = cveId(ref)}
                  <tr>
                    <td class="mono nowrap">
                      {#if cve}<a href="/cve?id={cve}">{ref}</a>{:else}{ref}{/if}
                    </td>
                    <td>{description}</td>
                  </tr>
                {/each}
              </tbody>
            </table>
          </div>
        </section>
      {/if}
    {:else if data.category}
      <section>
        <h2>About this category</h2>
        <Prose blocks={data.category.summary} names={data.names} />
      </section>
      <section>
        <h2>Members</h2>
        {@render links(data.category.members)}
      </section>
    {/if}
  </div>

  <aside class="side">
    {#if weakness}
      <Interchange links={[{ href: `/cve?cwe=${entry.id}`, label: 'Recent CVEs with this CWE' }]} />
    {/if}

    {#each related as group (group.label)}
      <section>
        <h2>{group.label}</h2>
        {@render links(group.ids)}
      </section>
    {/each}

    {#if data.memberOf.length}
      <section>
        <h2>In categories</h2>
        {@render links(data.memberOf.map(({ id }) => id))}
      </section>
    {/if}

    {#if data.views.length}
      <section>
        <h2>In views</h2>
        <ul class="links">
          {#each data.views as view (view.id)}
            <li><a href="/cwe?view={view.id}">{view.label}</a></li>
          {/each}
        </ul>
      </section>
    {/if}

    {#if weakness && (weakness.introduced.length || weakness.platforms.length)}
      <section>
        <h2>Where it turns up</h2>
        <ul class="plain">
          {#each [...new Set(weakness.introduced.map(({ phase }) => phase))] as phase (phase)}
            <li>Introduced during {phase.toLowerCase()}</li>
          {/each}
          {#each weakness.platforms as { type, name, prevalence }, index (index)}
            <li>
              {type}: {name}{prevalence && prevalence !== 'Undetermined'
                ? ` (${prevalence.toLowerCase()})`
                : ''}
            </li>
          {/each}
        </ul>
      </section>
    {/if}

    <p class="credit">
      From CWE {data.version}. CWE content is © The MITRE Corporation, reproduced under the
      <a href="https://cwe.mitre.org/about/termsofuse.html" rel="external">CWE terms of use</a>.
    </p>
  </aside>
</div>

<style>
  .crumbs {
    display: flex;
    gap: var(--space-2);
    padding-top: var(--space-4);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .head {
    display: grid;
    gap: var(--space-3);
    padding-block: var(--space-2) var(--space-4);

    & h1 {
      font-size: var(--text-xl);
      letter-spacing: -0.01em;
    }

    & .id {
      color: var(--text-muted);
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
  }

  /* one row of fact cells, like the matrix header strip */
  .facts {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(9rem, 1fr));
    margin: 0 0 var(--space-5);
    border-top: var(--hairline) solid var(--line);
    border-left: var(--hairline) solid var(--line);

    & div {
      display: grid;
      gap: 2px;
      padding: var(--space-2) var(--space-3);
      border-right: var(--hairline) solid var(--line);
      border-bottom: var(--hairline) solid var(--line);
      background: var(--surface);
    }

    & dt {
      color: var(--text-muted);
      font-size: var(--text-xs);
      font-weight: 600;
      letter-spacing: 0.06em;
      text-transform: uppercase;
    }

    & dd {
      margin: 0;
      font-size: var(--text-sm);
      font-weight: 600;
    }
  }

  .layout {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(16rem, 22rem);
    gap: var(--space-6);
    align-items: start;
  }

  .main,
  .side {
    display: grid;
    gap: var(--space-5);

    & section {
      display: grid;
      gap: var(--space-2);
    }

    & h2 {
      font-size: var(--text-md);
    }

    & :global(p),
    & :global(li) {
      max-width: var(--measure);
    }

    & :global(ul:not(.links, .plain)) {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding-left: var(--space-5);
    }
  }

  .side {
    gap: var(--space-4);

    & h2 {
      font-size: var(--text-sm);
    }
  }

  .mapping {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3) var(--space-4);
    border: var(--hairline) solid var(--line-strong);
    background: var(--surface-raised);

    & h3 {
      margin-top: var(--space-2);
      font-size: var(--text-sm);
    }
  }

  .verdict {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    font-weight: 600;
  }

  .links,
  .plain {
    display: grid;
    gap: var(--hairline);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);
  }

  .links li {
    display: grid;
    gap: 2px;
  }

  .links a {
    text-decoration: none;

    & .mono {
      color: var(--text-muted);
    }

    &:hover {
      text-decoration: underline;
    }
  }

  .muted {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .terms {
    display: grid;
    gap: var(--space-2);
    margin: 0;

    & dt {
      font-weight: 650;
    }

    & dd {
      margin: 0;
      color: var(--text-muted);
    }
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    font-size: var(--text-sm);

    & :is(th, td) {
      padding: var(--space-1) var(--space-2);
      border: var(--hairline) solid var(--line);
      text-align: start;
      vertical-align: top;
    }

    & th {
      background: var(--surface-raised);
    }

    & td {
      background: var(--surface);
    }
  }

  .nowrap {
    white-space: nowrap;
  }

  .mitigations {
    display: grid;
    gap: var(--space-4);
    margin: 0;
    padding-left: var(--space-5);

    & li {
      display: grid;
      gap: var(--space-1);
    }
  }

  .credit {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  @media (max-width: 56rem) {
    .layout {
      grid-template-columns: minmax(0, 1fr);
    }
  }
</style>
