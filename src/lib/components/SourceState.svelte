<script lang="ts">
  import type { Outcome } from '#lib/net/fetch.ts';

  let {
    source,
    outcome,
    missing = 'has no record of this',
    retry
  }: {
    /** who we asked, e.g. "NVD" */
    source: string;
    /** undefined while the request is in flight */
    outcome: Outcome<unknown> | undefined;
    missing?: string;
    retry?: () => void;
  } = $props();
</script>

{#if !outcome}
  <p class="state loading" role="status">Asking {source}...</p>
{:else if outcome.status === 'missing'}
  <p class="state missing" role="status">{source} {missing}.</p>
{:else if outcome.status === 'failed'}
  <p class="state failed" role="alert">
    <span>{source} {outcome.message}. This says nothing about whether the record exists.</span>
    {#if retry}<button type="button" class="button" onclick={retry}>Try again</button>{/if}
  </p>
{/if}

<style>
  .state {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-2);
    padding: var(--space-2) var(--space-3);
    border: var(--hairline) solid var(--line);
    border-left-width: 3px;
    background: var(--surface);
    font-size: var(--text-sm);
  }

  .loading {
    color: var(--text-muted);
  }

  .missing {
    border-left-color: var(--line-strong);
  }

  .failed {
    border-left-color: var(--warn);
    background: var(--warn-soft);
  }
</style>
