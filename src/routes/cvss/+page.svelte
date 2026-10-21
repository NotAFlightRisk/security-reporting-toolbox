<script lang="ts">
  import { afterNavigate, goto } from '$app/navigation';
  import QueryField from '#lib/components/QueryField.svelte';
  import Severity from '#lib/components/Severity.svelte';
  import ToolGroup from '#lib/components/ToolGroup.svelte';
  import Toolbar from '#lib/components/Toolbar.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { to31, to40, type Converted } from '#lib/cvss/convert.ts';
  import { groupNames, isUnset, metricsFor, type Metric, type Version } from '#lib/cvss/metrics.ts';
  import { parseVector, toVector } from '#lib/cvss/parse.ts';
  import { score } from '#lib/cvss/score.ts';
  import { setParams } from '#lib/query.svelte.ts';
  import { tool } from '#lib/tools.ts';
  import Guide, { faq } from './Guide.svelte';
  import MetricHelp from './MetricHelp.svelte';
  import MetricMatrix from './MetricMatrix.svelte';
  import ScorePanel from './ScorePanel.svelte';

  const editable: Version[] = ['3.1', '4.0'];
  const blank = (): Record<Version, Record<string, string>> => ({
    '2.0': {},
    '3.0': {},
    '3.1': {},
    '4.0': {}
  });

  let version = $state<Version>('3.1');
  let chosen = $state(blank());
  let draft = $state('');
  let problem = $state<string | null>(null);
  let notes = $state<string[]>([]);
  let focused = $state<Metric>(metricsFor['3.1'][0]);
  let converted = $state<(Converted & { version: Version }) | null>(null);

  const values = $derived(chosen[version]);
  const metrics = $derived(metricsFor[version]);
  const vector = $derived(toVector(version, values));
  const scores = $derived(score(version, values));
  const left = $derived(
    metrics
      .filter((metric) => metric.group === 'base' && !values[metric.key])
      .map((metric) => metric.key)
  );
  const extras = $derived(
    [...new Set(metrics.map((metric) => metric.group))].filter((group) => group !== 'base')
  );
  const convertedScore = $derived(converted && score(converted.version, converted.values));
  const upgraded = $derived(version === '3.0' ? score('3.1', values) : null);

  // clicks only touch the address bar, so a fast run of them can't race a navigation
  function writeUrl() {
    const url = new URL(location.href);
    if (Object.keys(values).length) url.searchParams.set('vector', vector);
    else url.searchParams.delete('vector');
    goto(url, { shallow: true, replace: true });
  }

  function pick(key: string, value: string) {
    if (isUnset(value)) delete chosen[version][key];
    else chosen[version][key] = value;
    converted = null;
    writeUrl();
  }

  function load(input: string) {
    const parsed = parseVector(input);
    notes = parsed.notes;
    if (parsed.errors.length) {
      problem = parsed.errors.join(' ');
      return false;
    }
    problem = null;
    version = parsed.version;
    chosen[parsed.version] = parsed.values;
    focused = metricsFor[parsed.version][0];
    converted = null;
    return true;
  }

  function decode(text: string) {
    if (!text) {
      problem = 'Paste a vector first, like CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H.';
      return;
    }
    if (load(text)) setParams({ vector: toVector(version, values) });
  }

  function switchTo(next: Version) {
    version = next;
    focused = metricsFor[next][0];
    converted = null;
    notes = [];
    writeUrl();
  }

  function reset() {
    chosen = blank();
    problem = null;
    notes = [];
    converted = null;
  }

  function clear() {
    reset();
    draft = '';
    writeUrl();
  }

  function convert() {
    const target = version === '4.0' ? '3.1' : '4.0';
    converted = { version: target, ...(target === '4.0' ? to40(values) : to31(values)) };
  }

  function useConverted() {
    if (!converted) return;
    chosen[converted.version] = converted.values;
    version = converted.version;
    focused = metricsFor[version][0];
    converted = null;
    notes = [];
    setParams({ vector: toVector(version, values) });
  }

  // a blank or broken vector in the URL means a blank calculator, never the last score
  function follow(fromUrl: string) {
    if (fromUrl === vector) return;
    reset();
    draft = fromUrl;
    if (fromUrl) load(fromUrl);
  }

  // our own clicks are shallow gotos, everything else (links, back, forward) gets followed
  afterNavigate(({ type, shallow }) => {
    if (type === 'goto' && shallow) return;
    follow(new URL(location.href).searchParams.get('vector') ?? '');
  });
</script>

<ToolPage tool={tool('cvss')} schema={[faq]}>
  <QueryField
    bind:value={draft}
    label="Paste a vector to decode it"
    placeholder="CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H"
    hint="Any version from 2.0 to 4.0. Case, spaces and brackets don't matter."
    {problem}
    button="Decode"
    onsubmit={decode}
  />

  {#if notes.length}
    <ul class="notes" role="status">
      {#each notes as note (note)}<li>{note}</li>{/each}
    </ul>
  {/if}

  <Toolbar label="Calculator controls">
    <ToolGroup caption="Version">
      <div class="segments versions">
        {#each editable.includes(version) ? editable : [version, ...editable] as option (option)}
          <button
            type="button"
            class="cell"
            aria-pressed={option === version}
            onclick={() => switchTo(option)}
          >
            {option}
          </button>
        {/each}
      </div>
    </ToolGroup>
    <ToolGroup caption="Convert (approximate)">
      <button
        type="button"
        class="button"
        onclick={convert}
        disabled={!scores || !editable.includes(version)}
      >
        To {version === '4.0' ? '3.1' : '4.0'}
      </button>
    </ToolGroup>
    <ToolGroup caption="Start again">
      <button type="button" class="button" onclick={clear} disabled={!Object.keys(values).length}>
        Clear
      </button>
    </ToolGroup>
  </Toolbar>

  {#if version === '3.0'}
    <div class="notice panel">
      <p>
        This is a CVSS 3.0 vector, scored with 3.0's rules. 3.1 uses the same metrics but fixed the
        rounding and tightened the guidance, so it's what you should publish.
        {#if upgraded}The same metrics score {upgraded.overall.toFixed(1)} in 3.1.{/if}
      </p>
      <button type="button" class="button" onclick={() => switchTo('3.1')}>Use 3.1</button>
    </div>
  {:else if version === '2.0'}
    <div class="notice panel">
      <p>
        CVSS 2.0 is retired. NVD stopped scoring new CVEs with it in 2022, and GitHub advisories
        don't take it. Its metrics don't map cleanly onto 3.1 or 4.0, so rescore from scratch.
      </p>
      <button type="button" class="button" onclick={() => switchTo('3.1')}>Score in 3.1</button>
    </div>
  {/if}

  <ScorePanel {scores} {vector} {left} />

  <div class="workspace">
    <MetricMatrix
      metrics={metrics.filter((metric) => metric.group === 'base')}
      {values}
      onpick={pick}
      onfocus={(metric) => (focused = metric)}
    />
    <MetricHelp metric={focused} chosen={values[focused.key]} />
  </div>

  <details class="more">
    <summary>More metrics: {extras.map((group) => groupNames[group]).join(', ')}</summary>
    {#each extras as group (group)}
      <section class="extra" aria-label="{groupNames[group]} metrics">
        <h2 class="label">{groupNames[group]}</h2>
        <MetricMatrix
          metrics={metrics.filter((metric) => metric.group === group)}
          {values}
          onpick={pick}
          onfocus={(metric) => (focused = metric)}
        />
      </section>
    {/each}
  </details>

  {#if converted}
    <section class="converted panel" aria-label="Converted vector">
      <div class="converted-head">
        <h2>Roughly the same in CVSS {converted.version}</h2>
        <Severity score={convertedScore?.overall ?? null} label="Converted score" />
      </div>
      <code>{toVector(converted.version, converted.values)}</code>
      <p class="caveat">
        Not an equivalent. The two versions measure different things, so check each of these:
      </p>
      <ul>
        {#each converted.checks as check (check)}<li>{check}</li>{/each}
      </ul>
      <div>
        <button type="button" class="button primary" onclick={useConverted}>
          Open it in the calculator
        </button>
      </div>
    </section>
  {/if}

  {#snippet guide()}
    <Guide />
  {/snippet}
</ToolPage>

<style>
  .notes {
    margin: 0;
    padding: var(--space-2) var(--space-3) var(--space-2) var(--space-5);
    border: var(--hairline) solid var(--accent);
    background: var(--accent-soft);
    font-size: var(--text-sm);
  }

  .versions .cell {
    min-width: 3.5rem;
    font-family: var(--font-mono);
    text-align: center;
  }

  .notice {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: var(--hairline) solid var(--warn);
    background: var(--warn-soft);
    font-size: var(--text-sm);

    & p {
      flex: 1 1 24rem;
    }
  }

  .workspace {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 18rem;
    align-items: start;
    gap: var(--space-3);

    @media (width < 60rem) {
      grid-template-columns: minmax(0, 1fr);
    }
  }

  .more {
    border: var(--hairline) solid var(--line);
    background: var(--surface);

    & summary {
      padding: var(--space-2) var(--space-3);
      font-size: var(--text-sm);
      font-weight: 600;
      cursor: pointer;
    }

    &[open] summary {
      border-bottom: var(--hairline) solid var(--line);
    }
  }

  .extra {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);

    & + .extra {
      border-top: var(--hairline) solid var(--line);
    }
  }

  .converted {
    display: grid;
    gap: var(--space-2);
    padding: var(--space-3);
    border: var(--hairline) solid var(--line);
    background: var(--surface);
    font-size: var(--text-sm);

    & h2 {
      font-size: var(--text-md);
    }

    & code {
      overflow-wrap: anywhere;
    }

    & ul {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding-left: var(--space-5);
    }
  }

  .converted-head {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .caveat {
    color: var(--text-muted);
  }
</style>
