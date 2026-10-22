<script lang="ts">
  let {
    parts
  }: {
    /** key parts are highlighted */
    parts: { text: string; label?: string; key?: boolean }[];
  } = $props();
</script>

<p class="anatomy">
  {#each parts as { text, label, key }, index (index)}
    <span class:key class:bare={!label}><code>{text}</code><small>{label}</small></span>
  {/each}
</p>

<style>
  .anatomy {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) 3px;
    padding: var(--space-4);
    border: var(--hairline) solid var(--line);
    border-radius: var(--radius);
    background: var(--surface);
  }

  span {
    display: grid;
    gap: var(--space-1);
  }

  code {
    padding-bottom: var(--space-1);
    border-bottom: 2px solid var(--line-strong);
    font-size: var(--text-md);
    white-space: pre;
  }

  small {
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .bare code {
    border-color: transparent;
  }

  .key {
    & code {
      border-color: var(--accent);
    }

    & small {
      color: var(--accent);
      font-weight: 700;
    }
  }
</style>
