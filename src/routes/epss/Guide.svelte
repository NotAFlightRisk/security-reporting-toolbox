<script lang="ts">
  const bands = [
    { range: 'Under 1%', note: 'Where most CVEs sit', heat: '20%' },
    { range: '1 to 10%', note: 'Higher than most', heat: '55%' },
    { range: 'Over 10%', note: 'Already a lot', heat: '100%' }
  ];
</script>

<section>
  <h2>Reading the numbers</h2>
  <p>
    EPSS (the Exploit Prediction Scoring System) is a model run by FIRST. Every day it gives each
    published CVE a probability that someone will try exploiting it in the next 30 days, trained on
    real attack data from sensors and honeypots.
  </p>
  <figure>
    <div class="bands">
      {#each bands as { range, note, heat } (range)}
        <span style:--heat={heat}>{range} <small>{note}</small></span>
      {/each}
    </div>
    <figcaption>
      For a sense of scale, <a href="/epss?cve=CVE-2021-44228">Log4Shell</a> currently sits at 99.999%.
      A typical bug in a niche plugin will be a fraction of a percent.
    </figcaption>
  </figure>
  <dl>
    <dt>Probability</dt>
    <dd>The actual chance, from 0 to 100%.</dd>
    <dt>Percentile</dt>
    <dd>
      How it ranks against every other scored CVE. 95% means it's more likely to be exploited than
      95% of them. Handy when the raw probability looks tiny but is still near the top.
    </dd>
  </dl>
</section>

<section>
  <h2>What it isn't</h2>
  <p>
    It's not a severity score, and it isn't proof of exploitation. Each of these answers a different
    question:
  </p>
  <figure>
    <ol class="flow">
      <li><b><a href="/kev">KEV</a></b> Is it being exploited right now?</li>
      <li><b>EPSS</b> How likely is that in the next 30 days?</li>
      <li><b><a href="/cvss">CVSS</a></b> How bad is it if it is?</li>
    </ol>
    <figcaption>A sensible order for triage: KEV first, then high EPSS, then high CVSS.</figcaption>
  </figure>
  <p>
    CVSS and EPSS don't track each other much - plenty of 9.8s never get touched. In a report, quote
    EPSS with its date (it changes daily) and don't use it to argue a bug is harmless.
  </p>
</section>

<section>
  <h2>Gaps</h2>
  <p>
    Brand new CVEs can take a day or two to get a score, and rejected ones never do. FIRST retrains
    the model now and then, so a jump across every CVE on the same day is usually a new model
    version rather than a sudden wave of attacks. The methodology and history are on
    <a href="https://www.first.org/epss/" target="_blank" rel="external">first.org/epss</a>.
  </p>
</section>

<style>
  .bands {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 3px;

    & span {
      display: grid;
      padding-top: var(--space-2);
      border-top: 0.5rem solid color-mix(in srgb, var(--accent) var(--heat), transparent);
      font-weight: 700;
    }

    & small {
      color: var(--text-muted);
      font-size: var(--text-sm);
      font-weight: 400;
    }
  }
</style>
