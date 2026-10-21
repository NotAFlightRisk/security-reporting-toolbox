<script lang="ts" module>
  export type Rating = 'None' | 'Low' | 'Medium' | 'High' | 'Critical';

  /** the CVSS qualitative scale, same bands for 3.x and 4.0 */
  export function rating(score: number): Rating {
    if (score === 0) return 'None';
    if (score < 4) return 'Low';
    if (score < 7) return 'Medium';
    if (score < 9) return 'High';
    return 'Critical';
  }

  const pips: Record<Rating, number> = { None: 0, Low: 1, Medium: 2, High: 3, Critical: 4 };
</script>

<script lang="ts">
  let {
    score,
    label,
    size = 'sm'
  }: {
    score: number | null;
    /** what the score is, e.g. "CVSS 3.1 base", read out by screen readers */
    label?: string;
    size?: 'sm' | 'lg';
  } = $props();

  const level = $derived(score === null ? null : rating(score));
</script>

<span
  class="severity {size} {level?.toLowerCase() ?? 'unknown'}"
  role="img"
  aria-label={`${label ? `${label}: ` : ''}${score === null ? 'no score' : `${score.toFixed(1)}, ${level}`}`}
>
  <span class="pips" aria-hidden="true">
    {#each { length: 4 }, index}<i class:on={level !== null && index < pips[level]}></i>{/each}
  </span>
  <b>{score === null ? '-' : score.toFixed(1)}</b>
  <span class="word">{level ?? 'Unscored'}</span>
</span>

<style>
  .severity {
    --tone: var(--sev-none);
    display: inline-flex;
    align-items: center;
    gap: var(--space-1);
    color: var(--tone);
    font-size: var(--text-sm);
    line-height: 1;
    white-space: nowrap;

    &.low {
      --tone: var(--sev-low);
    }

    &.medium {
      --tone: var(--sev-medium);
    }

    &.high {
      --tone: var(--sev-high);
    }

    &.critical {
      --tone: var(--sev-critical);
    }

    & b {
      font-family: var(--font-mono);
      font-weight: 700;
    }

    & .word {
      font-size: var(--text-xs);
      font-weight: 650;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }

    &.lg {
      gap: var(--space-2);
      font-size: var(--text-xl);

      & .word {
        font-size: var(--text-sm);
      }

      & .pips i {
        width: 6px;
        height: 18px;
      }
    }
  }

  /* bar count carries the level, so colour is never on its own */
  .pips {
    display: inline-flex;
    align-items: flex-end;
    gap: 2px;

    & i {
      width: 4px;
      height: 12px;
      border: var(--hairline) solid currentColor;
      opacity: 0.45;

      &.on {
        background: currentColor;
        opacity: 1;
      }
    }
  }
</style>
