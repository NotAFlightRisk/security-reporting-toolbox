<script lang="ts">
  import { untrack } from 'svelte';
  import CopyButton from '#lib/components/CopyButton.svelte';
  import QueryField from '#lib/components/QueryField.svelte';
  import SourceState from '#lib/components/SourceState.svelte';
  import ToolGroup from '#lib/components/ToolGroup.svelte';
  import Toolbar from '#lib/components/Toolbar.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { formatDate, percent, plural } from '#lib/format.ts';
  import { cveIds } from '#lib/ids.ts';
  import type { Outcome } from '#lib/net/fetch.ts';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { epssHistory, lookupEpss, type EpssScore } from '#lib/sources/epss.ts';
  import { tool } from '#lib/tools.ts';
  import History from './History.svelte';

  const asked = $derived(param('cve'));
  const ids = $derived(cveIds(asked));

  let input = $state('');
  let problem = $state<string | null>(null);
  let order = $state<'yours' | 'highest'>('yours');
  let chosen = $state<string | null>(null);
  let scores = $state<Outcome<Map<string, EpssScore>>>();
  let history = $state<Outcome<EpssScore>>();

  $effect(() => {
    input = ids.join(', ');
  });

  function load(current: string[]) {
    scores = undefined;
    if (current.length)
      lookupEpss(current).then((outcome) => current === ids && (scores = outcome));
  }

  $effect(() => {
    const current = ids;
    untrack(() => load(current));
  });

  const focus = $derived(
    chosen && ids.includes(chosen) ? chosen : ids.length === 1 ? ids[0] : null
  );
  $effect(() => {
    const cve = focus;
    history = undefined;
    if (cve) epssHistory(cve).then((outcome) => cve === focus && (history = outcome));
  });

  const found = $derived(scores?.status === 'ok' ? scores.data : null);
  const rows = $derived.by(() => {
    const listed = ids.map((cve) => ({ cve, score: found?.get(cve) ?? null }));
    if (order === 'yours') return listed;
    return [...listed].sort((a, b) => (b.score?.probability ?? -1) - (a.score?.probability ?? -1));
  });
  const scored = $derived(rows.filter((row) => row.score));
  const csv = $derived(
    ['cve,epss,percentile,date']
      .concat(
        rows.map(({ cve, score }) =>
          score ? `${cve},${score.probability},${score.percentile},${score.date}` : `${cve},,,`
        )
      )
      .join('\n')
  );
  const scoreDate = $derived(scored[0]?.score?.date);

  const fmt = (value: number) => percent(value, value < 0.01 ? 3 : 2);

  function submit(value: string) {
    const found = cveIds(value);
    problem = found.length ? null : 'No CVE IDs in there. They look like CVE-2024-12345.';
    if (found.length) setParams({ cve: found.join(',') });
  }

  const faq = [
    {
      q: 'What does an EPSS score mean?',
      a: 'It is the probability, from 0 to 1, that a CVE will see exploitation activity in the next 30 days, from a model FIRST retrains on real attack data and publishes every day.'
    },
    {
      q: 'What is the EPSS percentile?',
      a: 'The share of all scored CVEs with the same or a lower EPSS score. A percentile of 95% means the CVE scores higher than 95% of everything EPSS covers.'
    },
    {
      q: 'Is EPSS a severity score?',
      a: 'No. CVSS says how bad a bug is if it is exploited, EPSS says how likely exploitation is. Use both, plus KEV for exploitation that has already been seen.'
    }
  ];
  const schema = [
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ];
</script>

<ToolPage tool={tool('epss')} {schema}>
  <QueryField
    bind:value={input}
    label="CVE IDs"
    placeholder="CVE-2021-44228, CVE-2023-4863"
    hint="Paste as many as you like, in any format. Shift+Enter for a new line."
    multiline
    {problem}
    onsubmit={submit}
  />

  {#if ids.length}
    <Toolbar label="Results">
      <ToolGroup caption="Sort">
        <button
          type="button"
          class="cell"
          aria-pressed={order === 'yours'}
          onclick={() => (order = 'yours')}
        >
          Your order
        </button>
        <button
          type="button"
          class="cell"
          aria-pressed={order === 'highest'}
          onclick={() => (order = 'highest')}
        >
          Most likely first
        </button>
      </ToolGroup>
      <ToolGroup caption="Export">
        <CopyButton text={csv} label="Copy as CSV" />
      </ToolGroup>
      <ToolGroup caption="Scored" grow>
        <span class="tally" role="status">
          {#if found}
            {plural(scored.length, 'CVE')} of {ids.length} scored{scoreDate
              ? `, as of ${formatDate(scoreDate)}`
              : ''}
          {:else}
            {plural(ids.length, 'CVE')} asked about
          {/if}
        </span>
      </ToolGroup>
    </Toolbar>

    <SourceState source="FIRST's EPSS API" outcome={scores} retry={() => load(ids)} />

    {#if found}
      <div class="scroll">
        <table>
          <thead>
            <tr>
              <th scope="col">CVE</th>
              <th scope="col">Probability</th>
              <th scope="col">Percentile</th>
              <th scope="col">Scored on</th>
              <th scope="col"><span class="visually-hidden">History</span></th>
            </tr>
          </thead>
          <tbody>
            {#each rows as { cve, score } (cve)}
              <tr class:focus={cve === focus}>
                <th scope="row"><a href="/cve?id={cve}"><code>{cve}</code></a></th>
                {#if score}
                  <td>
                    <span class="meter" style:--level={score.probability}
                      ><b>{fmt(score.probability)}</b></span
                    >
                  </td>
                  <td class="mono">{percent(score.percentile, 1)}</td>
                  <td>{formatDate(score.date)}</td>
                  <td>
                    {#if ids.length > 1}
                      <button
                        type="button"
                        class="button"
                        aria-pressed={cve === focus}
                        onclick={() => (chosen = cve)}
                      >
                        30 days
                      </button>
                    {/if}
                  </td>
                {:else}
                  <td colspan="4" class="dim">
                    No score. EPSS hasn't scored this one (too new, rejected, or not a real CVE).
                  </td>
                {/if}
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {/if}

    {#if focus && found?.get(focus)}
      {#if history?.status === 'ok' && history.data.history.length > 1}
        <History cve={focus} points={history.data.history} />
      {:else}
        <SourceState
          source="FIRST's EPSS API"
          outcome={history}
          missing="has no history for this CVE"
        />
      {/if}
    {/if}
  {/if}

  {#snippet guide()}
    <h2>Reading the numbers</h2>
    <p>
      EPSS (the Exploit Prediction Scoring System) is a model run by FIRST. Every day it gives each
      published CVE a probability that someone will try exploiting it in the next 30 days, trained
      on real attack data from sensors and honeypots.
    </p>
    <dl>
      <dt>Probability</dt>
      <dd>
        The actual chance, from 0 to 100%. Most CVEs sit well under 1%, so 10% is already a lot.
      </dd>
      <dt>Percentile</dt>
      <dd>
        How it ranks against every other scored CVE. 95% means it's more likely to be exploited than
        95% of them. Handy when the raw probability looks tiny but is still near the top.
      </dd>
    </dl>
    <p>
      For a sense of scale, <a href="/epss?cve=CVE-2021-44228">Log4Shell</a> currently sits at 99.999%
      with a percentile of 100%. A typical bug in a niche plugin will be a fraction of a percent.
    </p>

    <h2>What it isn't</h2>
    <p>
      It's not a severity score. CVSS tells you how bad a bug is if it's exploited, EPSS tells you
      how likely that is, and they don't track each other much - plenty of 9.8s never get touched.
      It also isn't proof of exploitation. If you want "this is being exploited right now", that's
      <a href="/kev">CISA's KEV catalogue</a>.
    </p>
    <p>
      A sensible order for triage is KEV first, then high EPSS, then high CVSS. In a report, quote
      EPSS with its date (it changes daily) and don't use it to argue a bug is harmless.
    </p>

    <h2>Gaps</h2>
    <p>
      Brand new CVEs can take a day or two to get a score, and rejected ones never do. FIRST
      retrains the model now and then, so a jump across every CVE on the same day is usually a new
      model version rather than a sudden wave of attacks. The methodology and history are on
      <a href="https://www.first.org/epss/" rel="external">first.org/epss</a>.
    </p>
  {/snippet}
</ToolPage>

<style>
  .tally {
    font-size: var(--text-sm);
  }

  .scroll {
    overflow-x: auto;
  }

  table {
    width: 100%;
    border-collapse: collapse;
    background: var(--surface);
    font-size: var(--text-sm);

    & :is(th, td) {
      padding: var(--space-1) var(--space-2);
      border: var(--hairline) solid var(--line);
      text-align: start;
      vertical-align: middle;
    }

    & thead th {
      background: var(--surface-raised);
    }

    & tbody th {
      font-weight: 450;
      white-space: nowrap;
    }

    & .focus {
      background: var(--accent-soft);
    }
  }

  /* a bar behind the number, so a column of them reads at a glance */
  .meter {
    display: inline-block;
    min-width: 7rem;
    padding: 0 var(--space-1);
    background: linear-gradient(
      to right,
      var(--accent-soft) calc(var(--level) * 100%),
      transparent calc(var(--level) * 100%)
    );
    font-family: var(--font-mono);
  }

  .dim {
    color: var(--text-faint);
  }
</style>
