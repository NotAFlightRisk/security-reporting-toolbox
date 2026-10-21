<script lang="ts">
  import { onMount } from 'svelte';
  import { page } from '$app/state';
  import ThemeToggle from '#lib/components/ThemeToggle.svelte';
  import { loadPlausible } from '#lib/plausible.ts';
  import { site } from '#lib/site.ts';
  import { tools } from '#lib/tools.ts';
  import '../app.css';

  let { children } = $props();

  const current = (path: string) =>
    page.url.pathname === path || page.url.pathname.startsWith(`${path}/`);

  onMount(() => loadPlausible());
</script>

<a class="skip" href="#main">Skip to content</a>

<header class="masthead">
  <div class="bar">
    <a class="wordmark" href="/">
      <svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true">
        <rect x="0.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" />
        <rect x="8.5" y="0.5" width="7" height="7" fill="none" stroke="currentColor" />
        <rect x="0.5" y="8.5" width="7" height="7" fill="none" stroke="currentColor" />
        <rect x="8.5" y="8.5" width="7" height="7" class="lit" />
      </svg>
      <span>{site.name}</span>
    </a>
    <ThemeToggle />
  </div>
  <nav class="tabs" aria-label="Tools">
    {#each tools as { path, name, title } (path)}
      <a href={path} {title} aria-current={current(path) ? 'page' : undefined}>{name}</a>
    {/each}
  </nav>
</header>

<main id="main">
  {@render children()}
</main>

<footer class="colophon">
  <div class="inner">
    <p>
      Runs in your browser, straight against MITRE, NVD, CVE.org, GitHub, OSV, FIRST, CISA and
      deps.dev. No accounts, and nothing you type is stored.
    </p>
    <ul>
      <li><a href="/about">About and sources</a></li>
      <li><a href={site.repo} rel="external">Source on GitHub</a></li>
      <li><a href="{site.repo}/issues/new/choose" rel="external">Report a problem</a></li>
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
    background: var(--text);
    color: var(--page);

    &:focus {
      top: var(--space-2);
    }
  }

  .masthead {
    border-bottom: var(--hairline) solid var(--line-strong);
    background: var(--surface);
  }

  .bar,
  .tabs,
  main,
  .inner {
    max-width: var(--page-width);
    margin-inline: auto;
    padding-inline: var(--pad);
  }

  .bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-3);
    padding-block: var(--space-2);
  }

  .wordmark {
    display: inline-flex;
    align-items: center;
    gap: var(--space-2);
    color: var(--text);
    font-weight: 700;
    letter-spacing: -0.01em;
    text-decoration: none;

    & .lit {
      fill: var(--accent);
    }
  }

  /* layer tabs, Navigator style: the current one joins the page below */
  .tabs {
    display: flex;
    gap: var(--hairline);
    overflow-x: auto;
    scrollbar-width: thin;

    & a {
      flex: none;
      margin-bottom: calc(var(--hairline) * -1);
      padding: var(--space-2) var(--space-3);
      border: var(--hairline) solid var(--line);
      border-bottom-color: var(--line-strong);
      background: var(--surface-sunk);
      color: var(--text-muted);
      font-size: var(--text-sm);
      font-weight: 600;
      text-decoration: none;

      &:hover {
        color: var(--text);
        background: var(--surface-raised);
      }

      &[aria-current='page'] {
        border-color: var(--line-strong);
        border-top: 2px solid var(--accent);
        border-bottom-color: var(--page);
        background: var(--page);
        color: var(--text);
      }
    }
  }

  main {
    min-height: 70vh;
    padding-bottom: var(--space-8);
  }

  .colophon {
    border-top: var(--hairline) solid var(--line-strong);
    background: var(--surface);
    color: var(--text-muted);
    font-size: var(--text-sm);
  }

  .inner {
    display: flex;
    flex-wrap: wrap;
    justify-content: space-between;
    gap: var(--space-3) var(--space-6);
    padding-block: var(--space-5);

    & p {
      flex: 1 1 22rem;
      max-width: 60ch;
    }

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
