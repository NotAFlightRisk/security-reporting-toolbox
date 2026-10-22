<script lang="ts" module>
  import Bug from '@lucide/svelte/icons/bug';
  import Building2 from '@lucide/svelte/icons/building-2';
  import FileSearch from '@lucide/svelte/icons/file-search';
  import Gauge from '@lucide/svelte/icons/gauge';
  import Package from '@lucide/svelte/icons/package';
  import Percent from '@lucide/svelte/icons/percent';
  import Siren from '@lucide/svelte/icons/siren';
  import Tags from '@lucide/svelte/icons/tags';
  import type { ToolId } from '#lib/tools.ts';

  const icons = {
    cwe: Bug,
    cve: FileSearch,
    cvss: Gauge,
    epss: Percent,
    kev: Siren,
    versions: Tags,
    package: Package,
    cna: Building2
  };
</script>

<script lang="ts">
  let { id, size = 20 }: { id: ToolId; size?: number } = $props();

  const Icon = $derived(icons[id]);
</script>

<Icon {size} strokeWidth={1.75} />
