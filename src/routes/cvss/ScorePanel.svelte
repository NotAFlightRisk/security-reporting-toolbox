<script lang="ts">
  import CopyButton from '#lib/components/CopyButton.svelte';
  import Severity, { rating } from '#lib/components/Severity.svelte';
  import type { Scores } from '#lib/cvss/score.ts';

  let {
    scores,
    vector,
    left
  }: {
    scores: Scores | null;
    vector: string;
    /** names of base metrics still waiting for a value */
    left: string[];
  } = $props();

  const summary = $derived(
    scores ? `${vector} (${scores.overall.toFixed(1)} ${rating(scores.overall)})` : ''
  );
</script>

<div class="score panel">
  <div class="headline">
    <Severity score={scores?.overall ?? null} label={scores?.label ?? 'CVSS'} size="lg" />
    <span class="label">{scores?.label ?? 'Not scored yet'}</span>
  </div>

  {#if scores}
    <ul class="parts">
      {#each scores.parts as part (part.name)}
        <li><span>{part.name}</span> <b class="mono">{part.score.toFixed(1)}</b></li>
      {/each}
    </ul>
  {:else}
    <p class="left">
      Pick a value for {left.length === 1
        ? 'one more base metric'
        : `${left.length} more base metrics`}:
      {left.join(', ')}.
    </p>
  {/if}

  <div class="vector">
    <code>{vector}</code>
    <div class="copies">
      <CopyButton text={scores ? vector : ''} label="Copy vector" />
      <CopyButton text={summary} label="Copy with score" />
    </div>
  </div>
</div>

<style>
  .score {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: center;
    gap: var(--space-2) var(--space-5);
    padding: var(--space-3);

    @media (width < 40rem) {
      grid-template-columns: 1fr;
    }
  }

  .headline {
    display: grid;
    gap: var(--space-1);
  }

  .parts {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-1) var(--space-4);
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-sm);

    & span {
      color: var(--text-muted);
    }
  }

  .left {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .vector {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    grid-column: 1 / -1;
    padding-top: var(--space-2);
    border-top: var(--hairline) solid var(--line);

    & code {
      overflow-wrap: anywhere;
    }
  }

  .copies {
    display: flex;
    gap: var(--space-1);
  }
</style>
