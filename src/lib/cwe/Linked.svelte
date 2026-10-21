<script lang="ts">
  import { linkify } from './text.ts';

  let { text, names }: { text: string; names: Record<number, string> } = $props();
</script>

{#each linkify(text) as part, index (index)}{#if part.id !== undefined && names[part.id]}<a
      href="/cwe/{part.id}"
      title={names[part.id]}>{part.text}</a
    >{:else}{part.text}{/if}{/each}
