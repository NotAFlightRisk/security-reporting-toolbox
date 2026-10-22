<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import font from '@fontsource-variable/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-wght-normal.woff2?url';
  import ThemeToggle from '#lib/components/ThemeToggle.svelte';
  import { loadPlausible } from '#lib/plausible.ts';
  import { site } from '#lib/site.ts';
  import { tools } from '#lib/tools.ts';
  import '@fontsource-variable/atkinson-hyperlegible-next';
  import '../app.css';

  let { children } = $props();

  const current = (path: string) =>
    page.url.pathname === path || page.url.pathname.startsWith(`${path}/`);

  onMount(() => loadPlausible());
</script>

<svelte:head>
  <link rel="preload" href={font} as="font" type="font/woff2" crossorigin="anonymous" />
</svelte:head>

<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <div class="bar">
    <a class="wordmark" href="/">
      <svg viewBox="0 0 16 16" width="20" height="20" aria-hidden="true">
        <rect x="0.5" y="0.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" />
        <rect x="8.5" y="0.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" />
        <rect x="0.5" y="8.5" width="7" height="7" rx="1.5" fill="none" stroke="currentColor" />
        <rect x="8.5" y="8.5" width="7" height="7" rx="1.5" class="lit" />
      </svg>
      <span>{site.name}</span>
    </a>
    <nav class="tabs" aria-label="Tools">
      {#each tools as { path, name, title } (path)}
        <a href={path} {title} aria-current={current(path) ? 'page' : undefined}>{name}</a>
      {/each}
    </nav>
    <ThemeToggle />
  </div>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="colophon">
  <div class="inner">
    <p>Local tools for building security reports.</p>
    <ul>
      <li><a href="/about">About and sources</a></li>
      <li><a href={site.repo} target="_blank" rel="external">Source on GitHub</a></li>
      <li>
        <a href="{site.repo}/issues/new/choose" target="_blank" rel="external">Report a problem</a>
      </li>
    </ul>
  </div>
</footer>

<style>
  .skip {
    position: absolute;
    left: var(--pad);
    top: -10rem;
    z-index: 2;
    padding: var(--space-2) var(--space-3);
    border-radius: var(--radius);
    background: var(--text);
    color: var(--page);

    &:focus {
      top: var(--space-2);
    }
  }

  .masthead {
    border-bottom: var(--hairline) solid var(--line);
    background: var(--surface);
  }

  .bar,
  main,
  .inner {
    max-width: var(--page-width);
    margin-inline: auto;
    padding-inline: var(--pad);
  }

  /* one row when it fits, otherwise the tools drop below */
  .bar {
    display: grid;
    grid-template-areas: 'brand nav theme';
    grid-template-columns: auto 1fr auto;
    align-items: center;
    gap: var(--space-2) var(--space-5);
    padding-block: var(--space-2);

    @media (width < 64rem) {
      grid-template-areas: 'brand theme' 'nav nav';
      grid-template-columns: 1fr auto;
    }
  }

  .wordmark {
    grid-area: brand;
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text);
    font-weight: 700;
    text-decoration: none;

    & .lit {
      fill: var(--accent);
    }
  }

  .tabs {
    grid-area: nav;
    display: flex;
    gap: var(--space-1);

    /* too narrow for one row, so all eight sit in a 4x2 grid instead of hiding off-screen */
    @media (width < 36rem) {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
    }

    & a {
      padding: var(--space-1) var(--space-3);
      border-radius: var(--radius);
      color: var(--text-muted);
      font-size: var(--text-sm);
      font-weight: 650;
      text-align: center;
      text-decoration: none;

      &:hover {
        background: var(--surface-sunk);
        color: var(--text);
      }

      &[aria-current='page'] {
        background: var(--accent-soft);
        color: var(--accent);
      }
    }
  }

  /* auto margins stop it stretching */
  main {
    flex: 1;
    width: 100%;
    padding-bottom: var(--space-8);
  }

  .colophon {
    border-top: var(--hairline) solid var(--line);
    background: var(--surface);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-2) var(--space-6);
    padding-block: var(--space-3);

    & ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--space-2) var(--space-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }
  }
</style>
