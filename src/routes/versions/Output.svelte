<script lang="ts">
  import CopyButton from '#lib/components/CopyButton.svelte';
  import type { Ecosystem } from '#lib/ecosystems.ts';
  import {
    describe,
    githubAffected,
    githubPatched,
    osvAffected,
    type Range
  } from '#lib/versions/range.ts';

  let { ranges, ecosystem, name }: { ranges: Range[]; ecosystem: Ecosystem; name: string } =
    $props();

  const osv = $derived(JSON.stringify(osvAffected(ecosystem, name, ranges), null, 2));
  const summary = $derived(ranges.map(describe).join(' '));
</script>

<section class="output" aria-label="Advisory fields">
  <h2 class="label">For the GitHub advisory form</h2>
  <p class="hint">
    GitHub takes one range per affected product, so add one product per block below
    {ranges.length > 1 ? `(${ranges.length} of them)` : ''}.
  </p>
  <div class="blocks">
    {#each ranges as range, index (index)}
      <article class="block">
        <h3>Affected product {index + 1}</h3>
        <dl>
          <dt>Ecosystem</dt>
          <dd>{ecosystem.name}</dd>
          <dt>Package name</dt>
          <dd><code>{name || '(fill in above)'}</code></dd>
          <dt>Affected versions</dt>
          <dd class="copyable">
            <code>{githubAffected(range)}</code>
            <CopyButton text={githubAffected(range)} compact />
          </dd>
          <dt>Patched versions</dt>
          <dd class="copyable">
            {#if githubPatched(range)}
              <code>{githubPatched(range)}</code>
              <CopyButton text={githubPatched(range)} compact />
            {:else}
              <span class="empty">Leave blank, there's no known fix in this range</span>
            {/if}
          </dd>
        </dl>
        <p class="sentence">{describe(range)}</p>
      </article>
    {/each}
  </div>

  <div class="extras">
    <div class="extra">
      <div class="extra-head">
        <h3>In plain English</h3>
        <CopyButton text={summary} compact />
      </div>
      <p>{summary}</p>
    </div>
    <div class="extra">
      <div class="extra-head">
        <h3>OSV <code>affected</code> entry</h3>
        <CopyButton text={osv} compact />
      </div>
      <pre><code>{osv}</code></pre>
    </div>
  </div>
</section>

<style>
  .output {
    display: grid;
    gap: var(--space-2);
  }

  .hint {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .blocks {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
    gap: var(--hairline);
    border: var(--hairline) solid var(--line);
    background: var(--line);
  }

  .block {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding: var(--space-3);
    background: var(--surface);

    & h3 {
      font-size: var(--text-sm);
    }
  }

  dl {
    display: grid;
    grid-template-columns: max-content 1fr;
    gap: var(--space-1) var(--space-3);
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

  .empty,
  .sentence {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .extras {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: var(--space-3);
  }

  .extra {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding: var(--space-3);
    border: var(--hairline) solid var(--line);
    background: var(--surface);
    font-size: var(--text-sm);

    & pre {
      margin: 0;
      overflow-x: auto;
      font-size: var(--text-xs);
    }
  }

  .extra-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);

    & h3 {
      font-size: var(--text-sm);
    }
  }
</style>
