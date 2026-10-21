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
      <label class="cell" class:on={value === option.id}>
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

  .cell {
    display: flex;
    align-items: center;
    box-shadow: none;
    cursor: pointer;

    &:hover {
      background: var(--surface-sunk);
    }

    &.on {
      position: relative;
      border-color: var(--accent);
      background: var(--accent);
      color: var(--accent-text);
      font-weight: 600;
    }

    &:has(input:focus-visible) {
      outline: 2px solid var(--focus);
      outline-offset: -2px;
    }
  }
</style>
