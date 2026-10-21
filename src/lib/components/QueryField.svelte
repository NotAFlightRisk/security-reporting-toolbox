<script lang="ts">
  let {
    value = $bindable(''),
    label,
    placeholder,
    hint,
    problem,
    mono = true,
    multiline = false,
    button = 'Look up',
    onsubmit
  }: {
    value?: string;
    label: string;
    placeholder?: string;
    /** shown under the field when there's nothing wrong */
    hint?: string;
    /** what's wrong with the input and how to fix it, turns the field red */
    problem?: string | null;
    mono?: boolean;
    multiline?: boolean;
    button?: string;
    onsubmit: (value: string) => void;
  } = $props();

  const id = $props.id();

  function submit(event: SubmitEvent) {
    event.preventDefault();
    onsubmit(value.trim());
  }

  // Enter submits a textarea too, Shift+Enter still gets you a new line
  function keydown(event: KeyboardEvent) {
    if (event.key !== 'Enter' || event.shiftKey) return;
    event.preventDefault();
    onsubmit(value.trim());
  }
</script>

<form class="query" class:invalid={problem} onsubmit={submit}>
  <label for={id}>{label}</label>
  <div class="row">
    {#if multiline}
      <textarea
        {id}
        class:mono
        rows="2"
        bind:value
        {placeholder}
        spellcheck="false"
        aria-invalid={problem ? 'true' : undefined}
        aria-describedby="{id}-note"
        onkeydown={keydown}></textarea>
    {:else}
      <input
        {id}
        class:mono
        type="search"
        bind:value
        {placeholder}
        spellcheck="false"
        autocomplete="off"
        aria-invalid={problem ? 'true' : undefined}
        aria-describedby="{id}-note"
      />
    {/if}
    <button class="button primary" type="submit">{button}</button>
  </div>
  <p id="{id}-note" class="note" aria-live="polite">{problem ?? hint ?? ''}</p>
</form>

<style>
  .query {
    display: grid;
    gap: var(--space-1);

    & label {
      font-size: var(--text-sm);
      font-weight: 600;
    }
  }

  .row {
    display: flex;
    gap: var(--space-1);

    & :is(input, textarea) {
      flex: 1;
      min-width: 0;
      min-height: 2.25rem;
      font-size: var(--text-base);
      border-left-width: 3px;
    }

    & .button {
      min-height: 2.25rem;
    }
  }

  .mono {
    font-family: var(--font-mono);
  }

  .note {
    min-height: 1.2em;
    color: var(--text-muted);
    font-size: var(--text-xs);
  }

  .invalid {
    & :is(input, textarea) {
      border-color: var(--bad);
      background: var(--bad-soft);
    }

    & .note {
      color: var(--bad);
      font-weight: 600;
    }
  }
</style>
