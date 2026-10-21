<script lang="ts">
  import { isUnset, type Metric } from '#lib/cvss/metrics.ts';

  let {
    metrics,
    values,
    onpick,
    onfocus
  }: {
    metrics: Metric[];
    values: Record<string, string>;
    onpick: (key: string, value: string) => void;
    onfocus: (metric: Metric) => void;
  } = $props();

  const id = $props.id();

  // consecutive metrics sharing a part (4.0's "Vulnerable system" etc.) get one heading
  const parts = $derived(
    metrics.reduce<{ name?: string; metrics: Metric[] }[]>((list, metric) => {
      const last = list.at(-1);
      if (last && last.name === metric.part) last.metrics.push(metric);
      else list.push({ name: metric.part, metrics: [metric] });
      return list;
    }, [])
  );

  const isChosen = (metric: Metric, key: string) =>
    values[metric.key] === key || (isUnset(values[metric.key]) && isUnset(key));

  // arrow keys move the choice, like any radio group
  function keydown(event: KeyboardEvent, metric: Metric, index: number) {
    const step = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }[event.key];
    if (!step) return;
    event.preventDefault();
    const next = (index + step + metric.values.length) % metric.values.length;
    onpick(metric.key, metric.values[next].key);
    const group = (event.currentTarget as HTMLElement).parentElement;
    (group?.children[next + 1] as HTMLElement | undefined)?.focus();
  }
</script>

<div class="parts">
  {#each parts as part, partIndex (partIndex)}
    <div class="part" style="--count: {part.metrics.length}">
      {#if part.name}<span class="label">{part.name}</span>{/if}
      <div class="matrix">
        {#each part.metrics as metric (metric.key)}
          {@const chosen = metric.values.findIndex((value) => isChosen(metric, value.key))}
          <div
            class="column"
            role="radiogroup"
            aria-labelledby="{id}-{metric.key}"
            tabindex="-1"
            onfocusin={() => onfocus(metric)}
            onpointerdown={() => onfocus(metric)}
          >
            <span class="column-head" id="{id}-{metric.key}">
              {metric.name}
              <small class="mono">{metric.key}</small>
            </span>
            {#each metric.values as value, index (value.key)}
              <button
                type="button"
                class="cell"
                role="radio"
                aria-checked={isChosen(metric, value.key)}
                tabindex={index === Math.max(chosen, 0) ? 0 : -1}
                onclick={() => onpick(metric.key, value.key)}
                onkeydown={(event) => keydown(event, metric, index)}
              >
                {value.name}
                {#if !isUnset(value.key)}<span class="key mono">{value.key}</span>{/if}
              </button>
            {/each}
          </div>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .parts {
    --column: 9rem;
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3);
  }

  .part {
    display: grid;
    flex: 1 1 calc(var(--column) * var(--count));
    align-content: start;
    gap: var(--space-1);
  }

  .matrix {
    grid-template-columns: repeat(auto-fit, minmax(min(var(--column), 100%), 1fr));
  }

  .column:focus {
    outline: none;
  }

  .cell {
    display: flex;
    align-items: baseline;
    justify-content: space-between;
    gap: var(--space-2);
  }

  .key {
    opacity: 0.7;
    font-size: var(--text-xs);
  }
</style>
