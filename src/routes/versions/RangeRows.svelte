<script lang="ts">
  import { isBlank, parseGithub, type Problem, type Range } from '#lib/versions/range.ts';
  import type { Scheme } from '#lib/versions/schemes.ts';

  let {
    ranges = $bindable(),
    problems,
    scheme,
    make
  }: { ranges: Range[]; problems: Problem[]; scheme: Scheme; make: () => Range } = $props();

  const ends: { value: Range['end']; label: string; field: string }[] = [
    { value: 'fixed', label: 'Fixed in', field: 'Fixed in' },
    { value: 'last', label: 'Last affected', field: 'Last affected version' },
    { value: 'open', label: 'No fix yet', field: '' },
    { value: 'exact', label: 'Only one version', field: 'Affected version' }
  ];
  const field = (end: Range['end']) => ends.find((entry) => entry.value === end)!.field;

  let pasted = $state('');
  let pasteError = $state<string | null>(null);

  function addPasted(event: SubmitEvent) {
    event.preventDefault();
    const result = parseGithub(pasted);
    if ('error' in result) {
      pasteError = result.error;
      return;
    }
    ranges = [...ranges.filter((range) => !isBlank(range)), result.range];
    pasted = '';
    pasteError = null;
  }

  const id = $props.id();
</script>

<section class="ranges" aria-labelledby="{id}-title">
  <h2 id="{id}-title" class="label">Affected ranges</h2>
  <ol>
    {#each ranges as range, index (index)}
      {@const own = problems.filter((problem) => problem.range === index)}
      <li class="row" class:bad={own.some((problem) => problem.level === 'error')}>
        <span class="number" aria-hidden="true">{index + 1}</span>
        <div class="fields" role="group" aria-label="Range {index + 1}">
          {#if range.end !== 'exact'}
            <label>
              <span>Introduced in</span>
              <input
                class="mono"
                bind:value={range.introduced}
                placeholder="blank = every earlier version"
                spellcheck="false"
                autocomplete="off"
              />
            </label>
          {/if}
          <label>
            <span>Ends</span>
            <select bind:value={range.end}>
              {#each ends as end (end.value)}<option value={end.value}>{end.label}</option>{/each}
            </select>
          </label>
          {#if range.end !== 'open'}
            <label>
              <span>{field(range.end)}</span>
              <input
                class="mono"
                bind:value={range.version}
                placeholder={scheme.example.split(/[ ,]/)[0]}
                spellcheck="false"
                autocomplete="off"
              />
            </label>
          {/if}
        </div>
        <button
          type="button"
          class="button remove"
          aria-label="Remove range {index + 1}"
          disabled={ranges.length === 1}
          onclick={() => (ranges = ranges.filter((_, other) => other !== index))}>Remove</button
        >
        {#if own.length}
          <ul class="problems">
            {#each own as problem (problem.message)}
              <li class={problem.level}>{problem.message}</li>
            {/each}
          </ul>
        {/if}
      </li>
    {/each}
  </ol>

  <div class="actions">
    <button type="button" class="button" onclick={() => (ranges = [...ranges, make()])}
      >Add a range</button
    >
    <form class="paste" onsubmit={addPasted}>
      <label for="{id}-paste" class="visually-hidden">Paste ranges you already have</label>
      <input
        id="{id}-paste"
        class="mono"
        bind:value={pasted}
        placeholder={'Or paste one you have, like >= 1.0.0, < 1.2.3'}
        spellcheck="false"
        autocomplete="off"
        aria-invalid={pasteError ? 'true' : undefined}
        aria-describedby="{id}-paste-note"
      />
      <button class="button" type="submit" disabled={!pasted.trim()}>Read it in</button>
    </form>
  </div>
  <p id="{id}-paste-note" class="paste-note" role={pasteError ? 'alert' : undefined}>
    {pasteError ?? ''}
  </p>
</section>

<style>
  .ranges {
    display: grid;
    gap: var(--space-2);
  }

  ol {
    display: grid;
    gap: var(--hairline);
    margin: 0;
    padding: 0;
    border: var(--hairline) solid var(--line);
    background: var(--line);
    list-style: none;
  }

  .row {
    display: grid;
    grid-template-columns: auto 1fr auto;
    align-items: end;
    gap: var(--space-2) var(--space-3);
    padding: var(--space-2) var(--space-3);
    background: var(--surface);

    &.bad {
      box-shadow: inset 3px 0 0 var(--bad);
    }
  }

  .number {
    align-self: center;
    color: var(--text-faint);
    font-family: var(--font-mono);
    font-size: var(--text-sm);
  }

  .fields {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);

    & label {
      display: grid;
      flex: 1 1 11rem;
      gap: 2px;
      font-size: var(--text-xs);
      color: var(--text-muted);
    }
  }

  .mono {
    font-family: var(--font-mono);
  }

  .problems {
    grid-column: 2 / -1;
    display: grid;
    gap: 2px;
    margin: 0;
    padding: 0;
    list-style: none;
    font-size: var(--text-xs);
    font-weight: 600;

    & .error {
      color: var(--bad);
    }

    & .warning {
      color: var(--warn);
    }
  }

  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-2);
  }

  .paste {
    display: flex;
    flex: 1 1 20rem;
    gap: var(--space-1);

    & input {
      flex: 1;
      min-width: 0;
    }
  }

  .paste-note {
    min-height: 1.2em;
    color: var(--bad);
    font-size: var(--text-xs);
    font-weight: 600;
  }

  @media (max-width: 30rem) {
    .row {
      grid-template-columns: 1fr auto;
    }

    .number {
      display: none;
    }

    .problems {
      grid-column: 1 / -1;
    }
  }
</style>
