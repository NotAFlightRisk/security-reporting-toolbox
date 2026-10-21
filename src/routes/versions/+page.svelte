<script lang="ts">
  import { onMount } from 'svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { ecosystem, ecosystems, type EcosystemId } from '#lib/ecosystems.ts';
  import EcosystemPicker from '#lib/packages/EcosystemPicker.svelte';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { tool } from '#lib/tools.ts';
  import {
    decodeRanges,
    encodeRanges,
    isBlank,
    schemeOf,
    validate,
    type Range
  } from '#lib/versions/range.ts';
  import Guide from './Guide.svelte';
  import Output from './Output.svelte';
  import Published from './Published.svelte';
  import RangeRows from './RangeRows.svelte';
  import Tester from './Tester.svelte';

  const blank = (): Range => ({ introduced: '', end: 'fixed', version: '' });

  let picked = $state<EcosystemId | ''>('npm');
  let name = $state('');
  let ranges = $state<Range[]>([blank()]);
  let ready = $state(false);

  const current = $derived(ecosystems.find((entry) => entry.id === picked) ?? ecosystems[0]);
  const scheme = $derived(schemeOf(current));
  const packageName = $derived(current.normalise(name));
  const nameProblem = $derived(name.trim() ? current.check(packageName) : null);
  const problems = $derived(validate(ranges, scheme));
  const filled = $derived(
    ranges
      .filter((range) => !isBlank(range))
      .map((range) => ({
        ...range,
        introduced: range.introduced.trim(),
        version: range.version.trim()
      }))
  );
  const usable = $derived(
    filled.length > 0 && !problems.some((problem) => problem.level === 'error')
  );

  onMount(() => {
    picked = ecosystem(param('ecosystem'))?.id ?? 'npm';
    name = param('package');
    const saved = decodeRanges(param('r'));
    if (saved.length) ranges = saved;
    ready = true;
  });

  // keep the URL in step so a range can be shared, without a history entry per keystroke
  let timer: ReturnType<typeof setTimeout>;
  $effect(() => {
    const values = {
      ecosystem: picked,
      package: name.trim() || null,
      r: encodeRanges(filled) || null
    };
    if (!ready) return;
    clearTimeout(timer);
    timer = setTimeout(() => setParams(values, { replace: true }), 400);
    return () => clearTimeout(timer);
  });

  const nameId = $props.id();
</script>

<ToolPage tool={tool('versions')}>
  <EcosystemPicker bind:value={picked} />

  <div class="package">
    <label for={nameId}>Package name</label>
    <input
      id={nameId}
      class="mono"
      bind:value={name}
      placeholder={current.example}
      spellcheck="false"
      autocomplete="off"
      aria-invalid={nameProblem?.level === 'error' ? 'true' : undefined}
      aria-describedby="{nameId}-note"
    />
    <p id="{nameId}-note" class="note" class:bad={nameProblem?.level === 'error'}>
      {#if nameProblem}
        {nameProblem.message}
      {:else if name.trim() && packageName !== name.trim()}
        Advisories use the registry's form of the name: <code>{packageName}</code>
      {:else}
        Versions follow {scheme.name}{scheme.exact
          ? ''
          : ", which is our best guess at this ecosystem's rules"}.
      {/if}
    </p>
  </div>

  <RangeRows bind:ranges {problems} {scheme} make={blank} />

  {#if usable}
    <Output ranges={filled} ecosystem={current} name={packageName} />
  {/if}

  <div class="checks">
    <Tester ranges={usable ? filled : []} {scheme} />
    {#if packageName && !nameProblem}
      <Published ranges={usable ? filled : []} ecosystem={current} name={packageName} />
    {/if}
  </div>

  {#snippet guide()}<Guide />{/snippet}
</ToolPage>

<style>
  .package {
    display: grid;
    gap: var(--space-1);
    max-width: 36rem;

    & label {
      font-size: var(--text-sm);
      font-weight: 600;
    }
  }

  .mono {
    font-family: var(--font-mono);
  }

  .note {
    color: var(--text-muted);
    font-size: var(--text-xs);

    &.bad {
      color: var(--bad);
      font-weight: 600;
    }
  }

  .checks {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 22rem), 1fr));
    gap: var(--space-3);
    align-items: start;
  }
</style>
