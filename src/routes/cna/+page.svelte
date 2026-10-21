<script lang="ts">
  import { onMount } from 'svelte';
  import QueryField from '#lib/components/QueryField.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import ToolGroup from '#lib/components/ToolGroup.svelte';
  import Toolbar from '#lib/components/Toolbar.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { loadCnas, partnerPage, search, tally, type Cna } from '#lib/cna.ts';
  import { plural } from '#lib/format.ts';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { tool } from '#lib/tools.ts';

  const page = 40;
  const roles = [
    { value: 'CNA', label: 'CNA' },
    { value: 'Root', label: 'Root' },
    { value: 'CNA-LR', label: 'Last resort' }
  ];

  let outcome = $state<Awaited<ReturnType<typeof loadCnas>>>();
  let draft = $state('');
  let shown = $state(page);

  const query = $derived(param('q'));
  const type = $derived(param('type'));
  const role = $derived(param('role'));

  const cnas = $derived(outcome?.status === 'ok' ? outcome.data : []);
  const types = $derived(tally(cnas, (cna) => cna.types).slice(0, 6));
  const results = $derived(search(cnas, { query, type, role }));
  const fallbacks = $derived(
    cnas.filter((cna) => cna.roles.includes('CNA-LR') || cna.shortName === 'GitHub_M')
  );

  const load = () => {
    outcome = undefined;
    loadCnas().then((result) => (outcome = result));
  };

  onMount(load);

  $effect(() => {
    draft = query;
    shown = page;
  });

  const sections = (cna: Cna) => [
    { label: 'Contact', items: cna.links },
    { label: 'Disclosure policy', items: cna.policies },
    { label: 'Advisories', items: cna.advisories }
  ];

  const toggle = (name: 'type' | 'role', value: string, current: string) =>
    setParams({ [name]: current === value ? null : value }, { replace: true });
</script>

{#snippet record(cna: Cna)}
  <details class="cna">
    <summary>
      <span class="name">
        <b>{cna.org}</b>
        <code>{cna.shortName}</code>
      </span>
      <span class="meta">
        {#each cna.roles.filter((r) => r !== 'CNA') as r (r)}<span class="tag">{r}</span>{/each}
        {#each cna.types as t (t)}<span class="tag">{t}</span>{/each}
        {#if cna.country}<span>{cna.country}</span>{/if}
      </span>
      <span class="scope">{cna.scope || 'No scope published.'}</span>
    </summary>
    <div class="detail">
      <dl>
        {#if cna.emails.length}
          <dt>Email</dt>
          <dd>
            {#each cna.emails as email (email)}<a href="mailto:{email}">{email}</a>{/each}
          </dd>
        {/if}
        {#each sections(cna) as { label, items } (label)}
          {#if items.length}
            <dt>{label}</dt>
            <dd>
              {#each items as item (item.url)}
                <a href={item.url} rel="external noopener">{item.label}</a>
              {/each}
            </dd>
          {/if}
        {/each}
        {#if cna.root}
          <dt>Root</dt>
          <dd>{cna.root}</dd>
        {/if}
        {#if cna.id}
          <dt>CNA ID</dt>
          <dd><code>{cna.id}</code></dd>
        {/if}
      </dl>
      <a class="button" href={partnerPage(cna.shortName)} rel="external noopener">
        Partner page on cve.org
      </a>
    </div>
  </details>
{/snippet}

<ToolPage tool={tool('cna')}>
  <QueryField
    bind:value={draft}
    label="Organisation, product or keyword"
    placeholder="e.g. WordPress plugins, Apache, Siemens, npm"
    hint="Searches names and each CNA's published scope, so product names work too."
    mono={false}
    button="Search"
    onsubmit={(value) => setParams({ q: value })}
  />

  <Toolbar label="Filters">
    <ToolGroup caption="Type">
      <div class="segments">
        {#each types as [value, total] (value)}
          <button
            type="button"
            class="cell"
            aria-pressed={type === value}
            onclick={() => toggle('type', value, type)}
          >
            {value} <small>{total}</small>
          </button>
        {/each}
      </div>
    </ToolGroup>
    <ToolGroup caption="Role">
      <div class="segments">
        {#each roles as { value, label } (value)}
          <button
            type="button"
            class="cell"
            aria-pressed={role === value}
            onclick={() => toggle('role', value, role)}
          >
            {label}
          </button>
        {/each}
      </div>
    </ToolGroup>
  </Toolbar>

  <SourceState source="The CVE Program's partner list" {outcome} retry={load} />

  {#if outcome?.status === 'ok'}
    <p class="count" role="status">
      {plural(results.length, 'partner')}
      {query || type || role ? 'match' : 'in the programme'}
      {#if query || type || role}
        <button
          type="button"
          class="link"
          onclick={() => setParams({ q: null, type: null, role: null })}>Clear</button
        >
      {/if}
    </p>

    <div class="results">
      {#each results.slice(0, shown) as cna (cna.shortName)}
        {@render record(cna)}
      {:else}
        <div class="none panel">
          <p>
            No CNA mentions that. A CNA that doesn't list a product in its scope can't assign for
            it, so try the vendor's name, or go to one of these:
          </p>
          <div class="results">
            {#each fallbacks as cna (cna.shortName)}{@render record(cna)}{/each}
          </div>
        </div>
      {/each}
    </div>

    {#if results.length > shown}
      <button type="button" class="button" onclick={() => (shown += page)}>
        Show {Math.min(page, results.length - shown)} more
      </button>
    {/if}
  {/if}

  {#snippet guide()}
    <h2>How to get a CVE for a vulnerability</h2>
    <p>
      A CVE ID can only come from a CVE Numbering Authority (CNA), and each one only covers what's
      in its scope. So the question is never "who gives out CVEs", it's "whose scope is this in".
      Work down this list and stop at the first one that fits.
    </p>
    <ol>
      <li>
        <b>The vendor or project itself.</b> Search for it above. If it's a CNA, report the bug to them
        through their disclosure policy and they'll assign the CVE when they publish.
      </li>
      <li>
        <b>A CNA whose scope covers the product.</b> Plenty of CNAs cover other people's software, like
        WordPress plugins (Wordfence, Patchstack, WPScan) or open source ecosystems. Search for the product
        type, not just the vendor.
      </li>
      <li>
        <b>GitHub, for projects hosted there.</b> If the maintainers can open a draft security advisory,
        they can request a CVE from GitHub in one click. As a researcher you can suggest it through private
        vulnerability reporting.
      </li>
      <li>
        <b>The root or CNA of last resort.</b> Nobody else fits? MITRE handles most things via
        <a href="https://cveform.mitre.org/" rel="external">the CVE request form</a>, and CISA
        covers industrial control systems and medical devices. Filter by "Last resort" above to see
        them.
      </li>
    </ol>
    <p>
      Ask one CNA at a time. Requesting from two at once is how a bug ends up with two IDs, and one
      of them gets rejected as a duplicate later.
    </p>

    <h2>What a CVE request needs</h2>
    <ul>
      <li>
        The product, vendor and affected versions (the <a href="/versions">versions builder</a> helps).
      </li>
      <li>The weakness type, ideally as a CWE (try the <a href="/cwe">CWE explorer</a>).</li>
      <li>
        What an attacker gets out of it, and what they need first (CVSS covers this, see the <a
          href="/cvss">calculator</a
        >).
      </li>
      <li>A public reference once there is one: an advisory, a fix commit or a release note.</li>
    </ul>

    <h2>Roles you'll see in the list</h2>
    <dl>
      <dt>CNA</dt>
      <dd>Assigns CVEs within its own scope, usually its own products.</dd>
      <dt>Root</dt>
      <dd>Looks after a group of CNAs (by country or sector) and handles disputes in that area.</dd>
      <dt>Last resort</dt>
      <dd>Assigns for anything in its area that no other CNA covers.</dd>
    </dl>
    <p>
      The data comes straight from the
      <a href="https://www.cve.org/PartnerInformation/ListofPartners" rel="external"
        >CVE Program's partner list</a
      >, fetched fresh every time you open this page.
    </p>
  {/snippet}
</ToolPage>

<style>
  .segments small {
    opacity: 0.7;
  }

  .count {
    display: flex;
    gap: var(--space-2);
    align-items: baseline;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .link {
    padding: 0;
    border: 0;
    background: none;
    color: var(--accent);
    text-decoration: underline;
    cursor: pointer;
  }

  .results {
    display: grid;
    gap: var(--hairline);
    border: var(--hairline) solid var(--line);
    background: var(--line);
  }

  .cna {
    background: var(--surface);

    & summary {
      display: grid;
      gap: var(--space-1);
      padding: var(--space-2) var(--space-3);
      cursor: pointer;
      list-style: none;

      &::-webkit-details-marker {
        display: none;
      }

      &:hover {
        background: var(--surface-sunk);
      }
    }

    &[open] summary {
      background: var(--surface-sunk);
    }
  }

  .name {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    gap: var(--space-2);

    & code {
      color: var(--text-muted);
      font-size: var(--text-xs);
    }
  }

  .meta {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-2);
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .tag {
    padding: 0 var(--space-1);
    border: var(--hairline) solid var(--line);
    background: var(--surface-sunk);
  }

  .scope {
    display: -webkit-box;
    overflow: hidden;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .cna[open] .scope {
    display: block;
    color: var(--text);
  }

  .detail {
    display: grid;
    gap: var(--space-3);
    justify-items: start;
    padding: var(--space-2) var(--space-3) var(--space-3);
    border-top: var(--hairline) dashed var(--line);
    font-size: var(--text-sm);

    & dl {
      display: grid;
      grid-template-columns: max-content 1fr;
      gap: var(--space-1) var(--space-4);
      margin: 0;
    }

    & dt {
      color: var(--text-muted);
    }

    & dd {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-1) var(--space-3);
      margin: 0;
      overflow-wrap: anywhere;
    }
  }

  .none {
    display: grid;
    gap: var(--space-3);
    padding: var(--space-3);
  }
</style>
