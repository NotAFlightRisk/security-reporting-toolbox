<script lang="ts">
  import { formatDate, percent } from '#lib/format.ts';
  import type { EpssPoint } from '#lib/sources/epss.ts';

  let { cve, points }: { cve: string; points: EpssPoint[] } = $props();

  const width = 600;
  const height = 140;
  const pad = 6;

  const values = $derived(points.map((point) => point.probability));
  const low = $derived(Math.min(...values));
  const high = $derived(Math.max(...values));
  // a flat line still needs some room, or it all collapses onto the axis
  const span = $derived(high - low || Math.max(high, 0.0001) * 0.1);

  const x = (index: number) => pad + (index / Math.max(points.length - 1, 1)) * (width - pad * 2);
  const y = (value: number) => height - pad - ((value - low) / span) * (height - pad * 2);
  const line = $derived(
    points.map((point, index) => `${x(index)},${y(point.probability)}`).join(' ')
  );

  const fmt = (value: number) => percent(value, value < 0.01 ? 3 : 2);
  const first = $derived(points[0]);
  const last = $derived(points.at(-1)!);
  const change = $derived(last.probability - first.probability);
  const summary = $derived(
    `${cve}: EPSS went from ${fmt(first.probability)} on ${formatDate(first.date)} to ${fmt(last.probability)} on ${formatDate(last.date)}` +
      (change === 0
        ? ', no change.'
        : `, ${change > 0 ? 'up' : 'down'} ${fmt(Math.abs(change))}.`) +
      ` Percentile ${percent(first.percentile, 1)} to ${percent(last.percentile, 1)}.`
  );
</script>

<figure class="history panel">
  <figcaption>
    <span class="label">30 days</span>
    <span>{summary}</span>
  </figcaption>
  <div class="plot">
    <span class="axis top">{fmt(high)}</span>
    <svg viewBox="0 0 {width} {height}" preserveAspectRatio="none" role="img" aria-label={summary}>
      <line x1={pad} x2={width - pad} y1={height - pad} y2={height - pad} class="base" />
      <polyline points={line} />
    </svg>
    <span class="axis bottom">{fmt(low)}</span>
  </div>
  <div class="dates">
    <span>{formatDate(first.date)}</span>
    <span>{formatDate(last.date)}</span>
  </div>
  <details>
    <summary>Daily values</summary>
    <div class="scroll">
      <table>
        <thead
          ><tr><th scope="col">Date</th><th scope="col">EPSS</th><th scope="col">Percentile</th></tr
          ></thead
        >
        <tbody>
          {#each [...points].reverse() as point (point.date)}
            <tr>
              <th scope="row">{formatDate(point.date)}</th>
              <td>{fmt(point.probability)}</td>
              <td>{percent(point.percentile, 1)}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  </details>
</figure>

<style>
  .history {
    --gutter: 4.5rem;
    display: grid;
    gap: var(--space-2);
    margin: 0;
    padding: var(--space-3);

    & figcaption {
      display: grid;
      gap: var(--space-1);
      font-size: var(--text-sm);
    }
  }

  .plot {
    display: grid;
    grid-template-columns: var(--gutter) 1fr;
    grid-template-rows: auto 1fr auto;

    & svg {
      grid-column: 2;
      grid-row: 1 / 4;
      width: 100%;
      height: 9rem;
      overflow: visible;
    }

    & polyline {
      fill: none;
      stroke: var(--accent);
      stroke-width: 2;
      vector-effect: non-scaling-stroke;
    }

    & .base {
      stroke: var(--line-strong);
      vector-effect: non-scaling-stroke;
    }
  }

  .axis {
    grid-column: 1;
    color: var(--text-muted);
    font-family: var(--font-mono);
    font-size: var(--text-xs);

    &.bottom {
      grid-row: 3;
      align-self: end;
    }
  }

  .dates {
    display: flex;
    justify-content: space-between;
    padding-left: var(--gutter);
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  details {
    font-size: var(--text-sm);

    & summary {
      cursor: pointer;
      color: var(--accent);
    }

    & .scroll {
      width: fit-content;
      max-width: 100%;
      margin-top: var(--space-2);
    }
  }
</style>
