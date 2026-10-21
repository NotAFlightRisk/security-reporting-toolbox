<script lang="ts">
  import { page } from '$app/state';
  import { tools } from '#lib/tools.ts';

  const lost = $derived(page.status === 404);
</script>

<svelte:head>
  <title>{lost ? 'Not found' : 'Something broke'} - Security Reporting Toolbox</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<article class="error">
  <h1>{lost ? "There's nothing at this address" : 'Something broke on our end'}</h1>
  <p>
    {lost
      ? 'It might have moved, or the link had a typo in it. One of these is probably what you were after:'
      : "It's been logged. Try again in a moment, or head to one of the tools:"}
  </p>
  <nav class="matrix" aria-label="Pick a tool">
    {#each tools as { path, title } (path)}
      <a class="cell" href={path}>{title}</a>
    {/each}
  </nav>
</article>

<style>
  .error {
    display: grid;
    gap: var(--space-3);
    max-width: 48rem;
    padding-block: var(--space-7);

    & h1 {
      font-size: var(--text-xl);
    }

    & p {
      color: var(--text-muted);
    }
  }

  .matrix {
    --column: 13rem;
  }
</style>
