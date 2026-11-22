<script lang="ts">
  import Check from '@lucide/svelte/icons/check';
  import Copy from '@lucide/svelte/icons/copy';

  let {
    text,
    label = 'Copy',
    what,
    compact = false
  }: {
    text: string;
    label?: string;
    /** what gets copied, for screen readers when the label alone is just "Copy" */
    what?: string;
    compact?: boolean;
  } = $props();

  let state = $state<'idle' | 'copied' | 'failed'>('idle');
  let timer: ReturnType<typeof setTimeout>;

  async function copy() {
    clearTimeout(timer);
    try {
      await navigator.clipboard.writeText(text);
      state = 'copied';
    } catch {
      state = 'failed';
    }
    timer = setTimeout(() => (state = 'idle'), 1600);
  }

  const shown = $derived(
    state === 'copied' ? 'Copied' : state === 'failed' ? 'Copy blocked' : label
  );
</script>

<button type="button" class="button" class:compact onclick={copy} disabled={!text}>
  {#if state === 'copied'}<Check size={14} />{:else}<Copy size={14} />{/if}
  <span aria-live="polite">{shown}</span>
  {#if what}<span class="visually-hidden">{what}</span>{/if}
</button>

<style>
  .compact {
    gap: var(--space-1);
    min-height: 1.75rem;
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
  }
</style>
