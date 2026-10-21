<script lang="ts">
  let { word, title }: { word: string; title?: string } = $props();
</script>

<span class="stamp" {title}>{word}</span>

<style>
  /* rejected, withdrawn and deprecated things stay on screen, just stamped */
  .stamp {
    display: inline-block;
    padding: 1px var(--space-2);
    border: 2px solid var(--bad);
    color: var(--bad);
    font-size: var(--text-xs);
    font-weight: 800;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    transform: rotate(-2deg);
  }
</style>
