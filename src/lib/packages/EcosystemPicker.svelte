<script lang="ts">
  import { ecosystems, type EcosystemId } from '#lib/ecosystems.ts';

  let {
    value = $bindable(),
    label = 'Ecosystem',
    any = false,
    onchange
  }: {
    value: EcosystemId | '';
    label?: string;
    /** adds an "Any" cell for tools that can guess */
    any?: boolean;
    onchange?: (value: EcosystemId | '') => void;
  } = $props();

  const name = $props.id();
  const options = $derived([...(any ? [{ id: '' as const, name: 'Any' }] : []), ...ecosystems]);
</script>

<fieldset class="picker">
  <legend class="label">{label}</legend>
  <div class="segments">
    {#each options as option (option.id)}
      <label class="cell">
        <input
          class="visually-hidden"
          type="radio"
          {name}
          value={option.id}
          checked={value === option.id}
          onchange={() => {
            value = option.id;
            onchange?.(option.id);
          }}
        />
        {option.name}
      </label>
    {/each}
  </div>
</fieldset>

<style>
  .picker {
    display: grid;
    gap: var(--space-1);
    min-width: 0;
    margin: 0;
    padding: 0;
    border: 0;
  }

  /* equal cells on a phone, so the rows end flush instead of trailing one name */
  .segments {
    @media (max-width: 40rem) {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
    }
  }

  .cell:has(input:focus-visible) {
    outline: 2px solid var(--focus);
    outline-offset: -2px;
  }
</style>
