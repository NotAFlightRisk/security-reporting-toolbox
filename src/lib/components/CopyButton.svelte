<script lang="ts">
  let {
    text,
    label = 'Copy',
    compact = false
  }: { text: string; label?: string; compact?: boolean } = $props();

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
  <svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true">
    {#if state === 'copied'}
      <path d="M3 8.5 6.5 12 13 4.5" fill="none" stroke="currentColor" stroke-width="1.8" />
    {:else}
      <path
        d="M5.5 5.5h7v8h-7zM3.5 10.5V2.5h7"
        fill="none"
        stroke="currentColor"
        stroke-width="1.4"
      />
    {/if}
  </svg>
  <span aria-live="polite">{shown}</span>
</button>

<style>
  .compact {
    min-height: 1.5rem;
    padding: 0 var(--space-2);
    font-size: var(--text-xs);
  }
</style>
