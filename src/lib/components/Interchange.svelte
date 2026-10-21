<script lang="ts">
  let { links }: { links: { href: string; label: string }[] } = $props();
</script>

{#if links.length}
  <nav class="interchange" aria-label="Open in another tool">
    <span class="label">Open in</span>
    {#each links as { href, label } (href)}
      <a class="button" {href}>{label}</a>
    {/each}
  </nav>
{/if}

<style>
  .interchange {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: var(--space-1) var(--space-2);
  }
</style>
