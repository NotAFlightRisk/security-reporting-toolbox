<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    caption,
    grow = false,
    children
  }: { caption: string; grow?: boolean; children: Snippet } = $props();
</script>

<div class="group" class:grow>
  <div class="controls">{@render children()}</div>
  <span class="caption">{caption}</span>
</div>

<style>
  .group {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    gap: var(--space-1);
    flex: 1 1 auto;
    padding: var(--space-2) var(--space-2) var(--space-1);
    background: var(--surface);

    &.grow {
      flex-basis: 18rem;
    }
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1);
  }

  .caption {
    color: var(--text-faint);
    font-size: var(--text-xs);
    line-height: 1.2;
    text-align: center;
  }
</style>
