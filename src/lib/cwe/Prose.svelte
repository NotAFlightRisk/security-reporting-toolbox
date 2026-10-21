<script lang="ts">
  import Linked from './Linked.svelte';
  import type { Block } from './types.ts';

  let { blocks, names }: { blocks: Block[]; names: Record<number, string> } = $props();
</script>

{#each blocks as block, index (index)}
  {#if typeof block === 'string'}
    <p><Linked text={block} {names} /></p>
  {:else}
    <ul>
      {#each block as item, at (at)}<li><Linked text={item} {names} /></li>{/each}
    </ul>
  {/if}
{/each}
