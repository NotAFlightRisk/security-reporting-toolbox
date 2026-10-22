<script lang="ts">
  import { onMount } from 'svelte';
  import Moon from '@lucide/svelte/icons/moon';
  import Sun from '@lucide/svelte/icons/sun';
  import SunMoon from '@lucide/svelte/icons/sun-moon';

  type Theme = 'system' | 'light' | 'dark';
  const order: Theme[] = ['system', 'light', 'dark'];
  const key = 'theme';

  const icons = { system: SunMoon, light: Sun, dark: Moon };
  const names = { system: 'Auto', light: 'Light', dark: 'Dark' };

  let theme = $state<Theme>('system');
  const Icon = $derived(icons[theme]);

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
  <Icon size={16} />
  <span>{names[theme]}</span>
</button>
