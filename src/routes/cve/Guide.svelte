<script lang="ts">
  import Severity from '#lib/components/Severity.svelte';
</script>

<section>
  <h2>Where the answers come from</h2>
  <p>
    Every lookup asks four places at once and shows what each one said, because they don't always
    agree and you'll want to know who said what before it goes in a report.
  </p>
  <figure>
    <ol class="flow">
      <li><b>CNA</b> Assigns the ID and writes the record. Often the vendor.</li>
      <li><b>CVE.org</b> The official record: description, affected versions, usually a score.</li>
      <li><b>NVD</b> NIST's copy, plus its own analysis and score.</li>
    </ol>
    <ol class="flow">
      <li>
        <b>GitHub</b> Advisories for open-source packages, with the exact package name and patched version.
      </li>
      <li><b>OSV</b> Google's aggregator, with the PYSEC, GO, RUSTSEC and distro IDs.</li>
    </ol>
    <figcaption>
      CVE records on top, package advisories below, each copied from the last.
    </figcaption>
  </figure>
  <p>
    CISA's "vulnrichment" (shown as CISA-ADP) adds a score, CWE and SSVC triage to the CVE.org
    record where the CNA didn't. NVD has been behind since early 2024, so plenty of CVEs sit at
    "Awaiting Analysis" with no NVD score at all.
  </p>
</section>

<section>
  <h2>Why the scores disagree</h2>
  <figure>
    <div class="versus">
      <span>CNA <Severity score={8.6} label="CNA" size="lg" /></span>
      <span>GitHub <Severity score={9.4} label="GitHub" size="lg" /></span>
    </div>
    <figcaption>
      Storybook's <a href="/cve?id=CVE-2026-114125">CVE-2026-114125</a>. GitHub reckons it hits
      other systems too (<code>SC:H/SI:H/SA:H</code>).
    </figcaption>
  </figure>
  <p>
    Each source scores the bug for itself. The CNA scores its own product, NVD scores independently
    and leans towards the worst case, and GitHub scores the package.
  </p>
  <p>
    Neither is wrong as such. The CNA's score is the one on the record. If you're the one reporting,
    put your own vector in the report and explain it - the <a href="/cvss">CVSS calculator</a> will check
    it for you.
  </p>
</section>

<section>
  <h2>Quoting IDs in a report</h2>
  <figure>
    <pre><code>CVE-2021-44228 (GHSA-jfh8-c2jp-5v3q)</code></pre>
    <figcaption>Use the CVE if there is one, and add the GHSA in brackets.</figcaption>
  </figure>
  <ul>
    <li>Search before asking for a CVE. Two IDs for one bug get one of them rejected later.</li>
    <li>
      Never quote a rejected ID. The rejection reason usually names the right one to use instead.
    </li>
    <li>A withdrawn GHSA is often a duplicate. Check "Also known as" for the one that stayed.</li>
  </ul>
</section>

<section>
  <h2>Limits</h2>
  <p>Your browser talks to each source directly, so their limits are your limits:</p>
  <dl>
    <dt>NVD</dt>
    <dd>5 requests every 30 seconds</dd>
    <dt>GitHub</dt>
    <dd>60 requests an hour without an API key</dd>
  </dl>
  <p>
    If one says no, the others still answer, and "couldn't be reached" never means "doesn't exist".
  </p>
</section>

<style>
  .versus {
    display: flex;
    flex-wrap: wrap;
    gap: var(--space-3) var(--space-7);

    & span {
      display: grid;
      gap: var(--space-1);
      font-weight: 700;
    }
  }
</style>
