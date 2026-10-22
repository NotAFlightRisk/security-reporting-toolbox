<script lang="ts">
  import Check from '@lucide/svelte/icons/check';

  const needs = [
    'A CVE ID',
    'Reliable evidence of active exploitation',
    'Clear remediation guidance, usually a patch'
  ];
</script>

<section>
  <h2>What KEV is</h2>
  <p>
    CISA's Known Exploited Vulnerabilities catalogue lists CVEs it has solid evidence are being
    exploited in the wild. It's short on purpose - a couple of thousand entries out of hundreds of
    thousands of CVEs - so being in it means a lot more than a high CVSS score.
  </p>
  <figure>
    <ul class="icons">
      {#each needs as need (need)}<li><Check size={18} /> {need}</li>{/each}
    </ul>
    <figcaption>
      A bug needs all three to get in. That last rule means some exploited bugs wait outside until a
      fix exists.
    </figcaption>
  </figure>
</section>

<section>
  <h2>Due dates</h2>
  <p>
    Each entry has a due date for US federal agencies to fix it, set by a Binding Operational
    Directive - BOD 22-01 for the older entries, and newer ones point at BOD 26-04 in their notes.
    Nobody else is bound by them, but they're a decent sanity check for your own patch deadlines.
  </p>
</section>

<section>
  <h2>Known ransomware use</h2>
  <dl>
    <dt>Known</dt>
    <dd>CISA has seen the bug used in a ransomware campaign.</dd>
    <dt>Unknown</dt>
    <dd>
      CISA can't confirm it, which doesn't mean it hasn't happened. Never quote Unknown as a no.
    </dd>
  </dl>
</section>

<section>
  <h2>Not in KEV?</h2>
  <p>
    That only means CISA hasn't confirmed exploitation, not that nobody's tried. Check
    <a href="/epss">EPSS</a> for the odds of exploitation, and vendor advisories for "exploited in the
    wild" notes, which often land before KEV does.
  </p>
  <figure>
    <ol class="flow">
      <li>
        <b>CISA's GitHub copy</b> Read first, since cisa.gov can't be read from a browser. It runs about
        a day behind.
      </li>
      <li>
        <b>NVD</b> Asked about anything not found, because it carries the KEV date on each CVE.
      </li>
    </ol>
    <figcaption>
      How a check works here. The official list is at
      <a
        href="https://www.cisa.gov/known-exploited-vulnerabilities-catalog"
        target="_blank"
        rel="external">cisa.gov</a
      >.
    </figcaption>
  </figure>
</section>
