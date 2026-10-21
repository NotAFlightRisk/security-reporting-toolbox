<script lang="ts">
  import { untrack } from 'svelte';
  import QueryField from '#lib/components/QueryField.svelte';
  import ToolPage from '#lib/components/ToolPage.svelte';
  import { cveId, cweId, detect, ghsaId } from '#lib/ids.ts';
  import type { Outcome } from '#lib/net/fetch.ts';
  import { param, setParams } from '#lib/query.svelte.ts';
  import { Lookup } from '#lib/sources/lookup.svelte.ts';
  import { searchNvd, type NvdPage } from '#lib/sources/nvd.ts';
  import { tool } from '#lib/tools.ts';
  import Record from './Record.svelte';
  import Results from './Results.svelte';

  const rawId = $derived(param('id'));
  const id = $derived(rawId ? (cveId(rawId) ?? ghsaId(rawId)) : null);
  const keyword = $derived(param('q'));
  const cwe = $derived(cweId(param('cwe')));
  const page = $derived(Math.max(0, Number(param('page')) || 0));

  let input = $state('');
  let problem = $state<string | null>(null);

  $effect(() => {
    input = rawId || keyword || (cwe !== null ? `CWE-${cwe}` : '');
  });

  const lookup = $derived(id ? new Lookup(id) : null);
  $effect(() => {
    const current = lookup;
    untrack(() => current?.run());
  });

  const filter = $derived(id ? null : keyword ? { keyword } : cwe !== null ? { cwe } : null);
  let results = $state<Outcome<NvdPage>>();
  let searchToken = 0;

  function search(current: NonNullable<typeof filter>, at: number) {
    const token = ++searchToken;
    results = undefined;
    searchNvd(current, at).then((outcome) => token === searchToken && (results = outcome));
  }

  $effect(() => {
    const [current, at] = [filter, page];
    if (current) untrack(() => search(current, at));
  });

  function submit(value: string) {
    problem = null;
    const found = detect(value);
    if (!found) problem = 'Paste a CVE or GHSA ID, or type a few words to search NVD.';
    else if (found.kind === 'cve' || found.kind === 'ghsa')
      setParams({ id: found.id, q: null, cwe: null, page: null });
    else if (found.kind === 'cwe')
      setParams({ cwe: String(found.id), id: null, q: null, page: null });
    else if (found.kind === 'cvss')
      problem = "That's a CVSS vector - the CVSS calculator can decode it.";
    else if (value.length < 3) problem = 'Give NVD at least three characters to search for.';
    else setParams({ q: value, id: null, cwe: null, page: null });
  }

  const rawProblem = $derived(
    rawId && !id
      ? `"${rawId}" doesn't look like a CVE (CVE-2024-12345) or GHSA (GHSA-xxxx-xxxx-xxxx) ID.`
      : null
  );
  const faq = [
    {
      q: 'Why do CVE.org, NVD and GitHub give different CVSS scores?',
      a: "Each scores the bug for themselves. The CNA that assigned the CVE scores its own product, NVD scores independently and tends towards the worst case, and GitHub scores the open-source package. The CNA's score is the one on the official record."
    },
    {
      q: 'Why does NVD say "Awaiting Analysis"?',
      a: "NVD has had a backlog since early 2024, so lots of CVEs are published without NVD's own score or CWE. Use the CNA's score, or CISA-ADP's where there is one."
    }
  ];
  const schema = [
    {
      '@type': 'FAQPage',
      mainEntity: faq.map(({ q, a }) => ({
        '@type': 'Question',
        name: q,
        acceptedAnswer: { '@type': 'Answer', text: a }
      }))
    }
  ];
</script>

<ToolPage tool={tool('cve')} {schema}>
  <QueryField
    bind:value={input}
    label="CVE, GHSA or keywords"
    placeholder="CVE-2021-44228, GHSA-jfh8-c2jp-5v3q or log4j jndi"
    hint="Paste a messy line from an email and it'll find the ID. Words search NVD."
    problem={problem ?? rawProblem}
    onsubmit={submit}
  />

  {#if lookup}
    {#key lookup}
      <Record {lookup} />
    {/key}
  {:else if filter}
    <Results
      outcome={results}
      {page}
      what={keyword ? `matching "${keyword}"` : `filed under CWE-${cwe}`}
      empty={keyword
        ? 'NVD only returns CVEs whose description contains every word, so try fewer or plainer ones, like the product name and the bug type.'
        : ''}
      onpage={(next) => setParams({ page: next ? String(next) : null })}
      retry={() => filter && search(filter, page)}
    />
  {/if}

  {#snippet guide()}
    <h2>Where the answers come from</h2>
    <p>
      Every lookup asks four places at once and shows what each one said, because they don't always
      agree and you'll want to know who said what before it goes in a report.
    </p>
    <dl>
      <dt>CVE.org</dt>
      <dd>
        The official record, written by the CNA that assigned the ID (often the vendor). It has
        their description, affected versions and usually their CVSS score. CISA's "vulnrichment"
        (shown as CISA-ADP) adds a score, CWE and SSVC triage where the CNA didn't.
      </dd>
      <dt>NVD</dt>
      <dd>
        NIST's copy of the record plus its own analysis. It's been behind since early 2024, so
        plenty of CVEs sit at "Awaiting Analysis" with no NVD score at all.
      </dd>
      <dt>GitHub</dt>
      <dd>
        GitHub's advisory database (GHSA IDs) covers open-source packages. Reviewed advisories list
        the exact package name, the vulnerable range and the first patched version, which CVE
        records often skip.
      </dd>
      <dt>OSV</dt>
      <dd>
        Google's aggregator, handy for the other IDs a bug goes by: PYSEC, GO, RUSTSEC and distro
        advisories.
      </dd>
    </dl>

    <h2>Why the scores disagree</h2>
    <p>
      Each source scores the bug for itself. The CNA scores its own product, NVD scores
      independently and leans towards the worst case, and GitHub scores the package. Storybook's
      <a href="/cve?id=CVE-2026-114125">CVE-2026-114125</a> is a good example - 8.6 from the CNA,
      9.4 from GitHub, because GitHub reckons it hits other systems too (<code>SC:H/SI:H/SA:H</code
      >).
    </p>
    <p>
      Neither is wrong as such. The CNA's score is the one on the record. If you're the one
      reporting, put your own vector in the report and explain it - the
      <a href="/cvss">CVSS calculator</a> will check it for you.
    </p>

    <h2>Quoting IDs in a report</h2>
    <ul>
      <li>
        Use the CVE if there is one and add the GHSA in brackets, e.g.
        <code>CVE-2021-44228 (GHSA-jfh8-c2jp-5v3q)</code>.
      </li>
      <li>Search before asking for a CVE. Two IDs for one bug get one of them rejected later.</li>
      <li>
        Never quote a rejected ID. The rejection reason usually names the right one to use instead.
      </li>
      <li>A withdrawn GHSA is often a duplicate. Check "Also known as" for the one that stayed.</li>
    </ul>

    <h2>Limits</h2>
    <p>
      Your browser talks to each source directly, so their limits are your limits: NVD allows 5
      requests every 30 seconds and GitHub 60 an hour without an API key. If one says no, the others
      still answer, and "couldn't be reached" never means "doesn't exist".
    </p>
  {/snippet}
</ToolPage>
