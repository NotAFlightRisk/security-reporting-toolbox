<script lang="ts">
  import type { Snippet } from 'svelte';

  let { children, label }: { children: Snippet; label: string } = $props();
</script>

<div class="toolbar" role="group" aria-label={label}>
  {@render children()}
</div>

<style>
  /* groups sit side by side, each with its tiny caption underneath */
  .toolbar {
    display: flex;
    flex-wrap: wrap;
    align-items: stretch;
    gap: var(--hairline);
    border: var(--hairline) solid var(--line);
    background: var(--line);
  }
</style>
