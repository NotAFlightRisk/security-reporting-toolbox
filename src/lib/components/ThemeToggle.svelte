<script lang="ts">
  import { onMount } from 'svelte';

  type Theme = 'system' | 'light' | 'dark';
  const order: Theme[] = ['system', 'light', 'dark'];
  const key = 'theme';

  let theme = $state<Theme>('system');

  function apply(next: Theme) {
    theme = next;
    if (next === 'system') delete document.documentElement.dataset.theme;
    else document.documentElement.dataset.theme = next;
  }

  function cycle() {
    const next = order[(order.indexOf(theme) + 1) % order.length];
    apply(next);
    try {
      localStorage.setItem(key, next);
    } catch {
      // private mode, the choice just won't stick
    }
  }

  onMount(() => {
    try {
      const saved = localStorage.getItem(key) as Theme | null;
      if (saved && order.includes(saved)) apply(saved);
    } catch {
      // storage blocked, stay on the system theme
    }
  });
</script>

<button type="button" class="button" onclick={cycle} aria-label="Theme: {theme}. Change theme">
  <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden="true">
    <circle cx="8" cy="8" r="6.5" fill="none" stroke="currentColor" stroke-width="1.3" />
    {#if theme === 'system'}
      <path d="M8 1.5a6.5 6.5 0 0 1 0 13z" fill="currentColor" />
    {:else if theme === 'dark'}
      <circle cx="8" cy="8" r="6.5" fill="currentColor" />
    {/if}
  </svg>
  <span>{theme === 'system' ? 'Auto' : theme === 'light' ? 'Light' : 'Dark'}</span>
</button>
