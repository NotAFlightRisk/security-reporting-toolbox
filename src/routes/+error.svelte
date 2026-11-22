<script lang="ts">
  import { page } from '$app/state';
  import { tools } from '#lib/tools.ts';

  const logged = import.meta.env.PUBLIC_SENTRY_DSN ? "It's been logged. " : '';

  const copy = {
    lost: {
      title: 'Not found',
      heading: "There's nothing at this address",
      lede: 'It might have moved, or the link had a typo in it. One of these is probably what you were after:'
    },
    unloaded: {
      title: "Couldn't load",
      heading: "This page didn't load",
      lede: 'Its code never arrived, which usually means the connection dropped. Check it and try again, or head to one of the tools:'
    },
    broke: {
      title: 'Something broke',
      heading: 'Something broke on our end',
      lede: `${logged}Try again in a moment, or head to one of the tools:`
    }
  };

  const shown = $derived.by(() => {
    if (page.status === 404) return copy.lost;
    return page.error?.unloaded ? copy.unloaded : copy.broke;
  });
</script>

<svelte:head>
  <title>{shown.title} - Security Reporting Toolbox</title>
  <meta name="robots" content="noindex" />
</svelte:head>

<article class="error">
  <h1>{shown.heading}</h1>
  <p>{shown.lede}</p>
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
