<script lang="ts">
  import { isUnset, type Metric } from '#lib/cvss/metrics.ts';

  let { metric, chosen }: { metric: Metric; chosen: string | undefined } = $props();
</script>

<aside class="help panel" aria-live="polite" aria-label="About this metric">
  <h2>{metric.name} <span class="mono">{metric.key}</span></h2>
  <p class="about">{metric.about}</p>
  <dl>
    {#each metric.values.filter((value) => value.about) as value (value.key)}
      {@const active = chosen === value.key || (isUnset(chosen) && isUnset(value.key))}
      <div class:active>
        <dt>{value.name} <span class="mono">{value.key}</span></dt>
        <dd>{value.about}</dd>
      </div>
    {/each}
  </dl>
</aside>

<style>
  .help {
    display: grid;
    align-content: start;
    gap: var(--space-2);
    padding: var(--space-3);
    font-size: var(--text-sm);

    & h2 {
      font-size: var(--text-md);
    }

    & .mono {
      color: var(--text-muted);
      font-size: var(--text-xs);
    }
  }

  .about {
    color: var(--text-muted);
  }

  dl {
    display: grid;
    gap: var(--space-1);
    margin: 0;

    & div {
      padding: var(--space-1) var(--space-2);
      border: var(--hairline) solid transparent;

      &.active {
        border-color: var(--accent);
        background: var(--accent-soft);
      }
    }

    & dt {
      font-weight: 600;
    }

    & dd {
      margin: 0;
      color: var(--text-muted);
    }
  }
</style>
