<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, label }: { children: Snippet; label: string } = $props();
</script>

<div class="toolbar" role="group" aria-label={label}>
  {@render children()}
</div>

<style>
  /* groups sit side by side, each labelled above its controls */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-6);
    padding: var(--space-3) var(--space-4);
    border: var(--hairline) solid var(--line);
    border-radius: var(--radius-lg);
    background: var(--surface);
  }
</style>
