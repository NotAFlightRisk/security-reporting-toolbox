<script lang="ts">
  let {
    ticks,
    from,
    to,
    inclusive = true,
    fixed
  }: {
    ticks: string[];
    /** index of the first affected version, or none for every version before */
    from?: number;
    /** index of the upper bound, or none when there's no fix yet */
    to?: number;
    /** whether the upper bound is affected itself */
    inclusive?: boolean;
    /** index of the first patched version */
    fixed?: number;
  } = $props();

  const at = (index: number) => ((index + 0.5) / ticks.length) * 100;
</script>

<!-- hidden from screen readers, the caption says the same in words -->
<div class="line" aria-hidden="true">
  <span
    class="bar"
    class:from={from !== undefined}
    class:to={to !== undefined}
    class:open={!inclusive}
    style:left="{from === undefined ? 0 : at(from)}%"
    style:right="{to === undefined ? 0 : 100 - at(to)}%"
  ></span>
  {#each ticks as tick, index (tick)}<code class:fixed={index === fixed}>{tick}</code>{/each}
</div>

<style>
  /* filled dot is affected, hollow isn't */
  .line {
    position: relative;
    display: grid;
    grid-auto-columns: minmax(0, 1fr);
    grid-auto-flow: column;
    padding-top: 1.5rem;
    color: var(--text-muted);
    font-size: var(--text-xs);
    text-align: center;

    &::before {
      content: '';
      position: absolute;
      inset: 0.75rem 0 auto;
      border-top: var(--hairline) solid var(--line-strong);
    }
  }

  code {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      top: -0.95rem;
      left: 50%;
      height: 0.4rem;
      border-left: var(--hairline) solid var(--line-strong);
    }

    &.fixed {
      color: var(--good);
      font-weight: 700;
    }
  }

  .bar {
    position: absolute;
    top: calc(0.75rem - 3px);
    z-index: 1;
    height: 6px;
    border-radius: 3px;
    background: var(--bad);

    &.from::before,
    &.to::after {
      content: '';
      position: absolute;
      top: 50%;
      width: 12px;
      aspect-ratio: 1;
      border: 2px solid var(--bad);
      border-radius: 50%;
      background: var(--bad);
      translate: -50% -50%;
    }

    &.from::before {
      left: 0;
    }

    &.to::after {
      left: 100%;
    }

    &.open::after {
      background: var(--surface);
    }
  }
</style>
