<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    caption,
    grow = false,
    children
  }: { caption: string; grow?: boolean; children: Snippet } = $props();

  const id = $props.id();
</script>

<div class="group" class:grow role="group" aria-labelledby={id}>
  <span class="label" {id}>{caption}</span>
  <div class="controls">{@render children()}</div>
</div>

<style>
  .group {
    display: grid;
    align-content: start;
    gap: var(--space-1);

    &.grow {
      flex: 1 1 18rem;
    }
  }

  .label {
    font-size: var(--text-xs);
  }

  .controls {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-2);
    min-height: var(--control);
  }
</style>
