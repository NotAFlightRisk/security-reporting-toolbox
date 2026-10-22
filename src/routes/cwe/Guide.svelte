<script lang="ts">
  import UsageTag from '#lib/cwe/UsageTag.svelte';

  // a real chain from MITRE's research view, broadest first
  const ladder = [
    { kind: 'Pillar', id: 707, name: 'Improper Neutralization', usage: 'Discouraged' },
    { kind: 'Class', id: 74, name: 'Injection', usage: 'Discouraged' },
    { kind: 'Base', id: 79, name: 'Cross-site Scripting', usage: 'Allowed' },
    { kind: 'Variant', id: 80, name: 'Basic XSS', usage: 'Allowed' }
  ];
  const usages = [
    ['Allowed', 'Fine to map a vulnerability to.'],
    [
      'Allowed-with-Review',
      "Usable, but it's high level or easy to misuse, so check a more specific entry doesn't fit better."
    ],
    ['Discouraged', 'Usually too vague. Only use one if nothing else fits after a proper look.'],
    ['Prohibited', 'Never map to these. Categories, views and deprecated entries.']
  ];
  const views = [
    [1435, 'Top 25', "MITRE's yearly ranking, worked out from recently published CVEs"],
    [
      1003,
      'NVD simplified',
      "The shallow list NVD's analysts map CVEs to, so a good shortlist if you want your CVE to sit nicely in NVD"
    ],
    [1344, 'OWASP Top 10', 'Web apps'],
    [699, 'Software development', 'Entries grouped by the area of a project they turn up in'],
    [1194, 'Hardware design', 'The same, for hardware']
  ] as const;
</script>

<section>
  <h2>How to pick the right CWE</h2>
  <p>
    A CWE names the mistake in the code, not what an attacker does with it. "Remote code execution"
    isn't a weakness, it's a consequence. The weakness is whatever let it happen, like gluing user
    input into a shell command (<a href="/cwe/78">CWE-78</a>).
  </p>
  <ol class="steps">
    <li>
      Write the root cause as one plain sentence: "the search page puts the query straight back into
      the HTML".
    </li>
    <li>Search for the key words of that sentence here, or browse a view above.</li>
    <li>Check the mapping usage tag before you settle on anything.</li>
    <li>
      Open the entry and look at its children. There's often a better fit one level down, and MITRE
      lists suggestions on the vaguer entries.
    </li>
  </ol>
</section>

<section>
  <h2>Aim for Base or Variant</h2>
  <figure>
    <ol class="ladder">
      {#each ladder as { kind, id, name, usage }, depth (id)}
        <li style:--depth={depth} class:aim={depth > 1}>
          <span class="kind">{kind}</span>
          <a href="/cwe/{id}"><code>CWE-{id}</code> {name}</a>
          <UsageTag {usage} />
        </li>
      {/each}
    </ol>
    <figcaption>
      Cross-site scripting, broadest first. Most XSS reports belong on CWE-79.
    </figcaption>
  </figure>
  <p>
    Base and Variant entries describe one specific mistake, which is what makes a CWE useful to
    whoever reads your report. Classes are fine when nothing more specific fits. Pillars are too
    broad to say much, and categories are just groupings for browsing.
  </p>
</section>

<section>
  <h2>What the mapping usage tags mean</h2>
  <dl>
    {#each usages as [usage, meaning] (usage)}
      <dt><UsageTag {usage} /></dt>
      <dd>{meaning}</dd>
    {/each}
  </dl>
  <p>
    <a href="/cwe/20">CWE-20</a>, <a href="/cwe/200">CWE-200</a> and every pillar are Discouraged.
  </p>
</section>

<section>
  <h2>Common mistakes</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr><th scope="col">Instead of</th><th scope="col">Try</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>CWE-20, because input was involved</td>
          <td>
            Where the input ends up: <a href="/cwe/89">CWE-89</a> in a SQL query,
            <a href="/cwe/22">CWE-22</a> in a file path. CWE-20 only fits when the validation itself
            is the mistake, and even then <a href="/cwe/1287">CWE-1287</a> and its siblings are usually
            closer.
          </td>
        </tr>
        <tr>
          <td>CWE-200 for any leak</td>
          <td>
            How it leaked: <a href="/cwe/209">CWE-209</a> through an error message,
            <a href="/cwe/532">CWE-532</a> into a log file, or a missing or broken access check like
            <a href="/cwe/862">CWE-862</a> or <a href="/cwe/639">CWE-639</a> (the classic IDOR).
          </td>
        </tr>
        <tr>
          <td>CWE-80 for every XSS</td>
          <td>
            <a href="/cwe/79">CWE-79</a>, which covers reflected, stored and DOM based XSS alike.
            CWE-80 is the narrow case of script tags getting through.
          </td>
        </tr>
        <tr>
          <td>The impact, like "account takeover"</td>
          <td>
            The line of code that's wrong. Impacts describe what happens next, so keep going back
            until you find it.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<section>
  <h2>Which view to browse</h2>
  <div class="scroll">
    <table>
      <tbody>
        {#each views as [id, view, use] (id)}
          <tr><th scope="row"><a href="/cwe?view={id}">{view}</a></th><td>{use}</td></tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p>
    MITRE's own
    <a href="https://cwe.mitre.org/documents/cwe_usage/guidance.html" target="_blank" rel="external"
      >root cause mapping guidance</a
    > goes into far more depth, and it's worth a read if you file reports regularly.
  </p>
  <p class="credit">
    CWE content is © The MITRE Corporation, reproduced under the
    <a href="https://cwe.mitre.org/about/termsofuse.html" target="_blank" rel="external"
      >CWE terms of use</a
    >.
  </p>
</section>

<style>
  .ladder {
    display: grid;
    gap: var(--space-1);
    margin: 0;
    padding: 0;
    list-style: none;

    & li {
      display: flex;
      flex-wrap: wrap;
      align-items: baseline;
      gap: var(--space-1) var(--space-3);
      margin-left: calc(var(--depth) * var(--space-5));
      padding: var(--space-2) var(--space-3);
      border: var(--hairline) solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);

      &.aim {
        border-color: var(--accent);
        background: var(--accent-soft);
      }
    }

    & .kind {
      min-width: 3.75rem;
      color: var(--text-muted);
      font-size: var(--text-sm);
    }

    & a {
      flex: 1;
      color: var(--text);
    }
  }

  .credit {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
</style>
