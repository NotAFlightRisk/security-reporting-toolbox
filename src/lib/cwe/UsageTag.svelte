<script lang="ts">
  import { usageNote } from './text.ts';

  let { usage }: { usage: string } = $props();
</script>

{#if usage}
  <span class="usage {usage.toLowerCase()}" title={usageNote(usage)}
    >{usage.replaceAll('-', ' ')}</span
  >
{/if}

<style>
  /* plain when it's fine to map, colour only for the exceptions */
  .usage {
    --tone: var(--text-muted);
    display: inline-block;
    padding: 0 var(--space-1);
    border: var(--hairline) solid var(--tone);
    border-radius: var(--radius);
    color: var(--tone);
    font-size: var(--text-xs);
    font-weight: 650;
    line-height: 1.5;
    white-space: nowrap;
  }

  .allowed-with-review,
  .discouraged {
    --tone: var(--warn);
  }

  .prohibited {
    --tone: var(--bad);
  }
</style>
