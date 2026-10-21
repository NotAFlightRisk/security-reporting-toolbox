<h2>How to pick the right CWE</h2>
<p>
  A CWE names the mistake in the code, not what an attacker does with it. "Remote code execution"
  isn't a weakness, it's a consequence. The weakness is whatever let it happen, like gluing user
  input into a shell command (<a href="/cwe/78">CWE-78</a>).
</p>
<ol>
  <li>
    Write the root cause as one plain sentence: "the search page puts the query straight back into
    the HTML".
  </li>
  <li>Search for the key words of that sentence here, or browse a view below.</li>
  <li>Check the mapping usage tag before you settle on anything (more on those in a sec).</li>
  <li>
    Open the entry and look at its children. There's often a better fit one level down, and MITRE
    lists suggestions on the vaguer entries.
  </li>
</ol>
<p>
  Aim for a Base or Variant entry. They describe one specific mistake, which is what makes a CWE
  useful to whoever reads your report. Classes are fine when nothing more specific fits. Pillars are
  too broad to say much, and categories are just groupings for browsing.
</p>

<h2>What the mapping usage tags mean</h2>
<dl>
  <dt>Allowed</dt>
  <dd>Fine to map a vulnerability to.</dd>
  <dt>Allowed with review</dt>
  <dd>
    Usable, but it's high level or easy to misuse, so check a more specific entry doesn't fit
    better.
  </dd>
  <dt>Discouraged</dt>
  <dd>
    Usually too vague. <a href="/cwe/20">CWE-20</a>, <a href="/cwe/200">CWE-200</a> and every pillar live
    here. Only use one if nothing else fits after a proper look.
  </dd>
  <dt>Prohibited</dt>
  <dd>Never map to these. Categories, views and deprecated entries.</dd>
</dl>

<h2>Common mistakes</h2>
<h3>Reaching for CWE-20 because input was involved</h3>
<p>
  Nearly every bug involves input somewhere. If input ends up in a SQL query, that's
  <a href="/cwe/89">CWE-89</a>. If it ends up in a file path, <a href="/cwe/22">CWE-22</a>. CWE-20
  only really fits when the mistake is the validation itself, and even then
  <a href="/cwe/1287">CWE-1287</a> and its siblings are usually closer.
</p>
<h3>CWE-200 for any leak</h3>
<p>
  Ask how it leaked. Through an error message is <a href="/cwe/209">CWE-209</a>, into a log file is
  <a href="/cwe/532">CWE-532</a>, and to someone who should've been stopped by an access check is a
  missing or broken check, like <a href="/cwe/862">CWE-862</a> or <a href="/cwe/639">CWE-639</a>
  (the classic IDOR).
</p>
<h3>CWE-80 for every XSS</h3>
<p>
  <a href="/cwe/80">CWE-80</a> is the narrow case of script tags getting through. Most XSS reports
  belong under <a href="/cwe/79">CWE-79</a>, which covers reflected, stored and DOM based XSS alike.
</p>
<h3>Mapping to the impact</h3>
<p>
  "Account takeover" or "denial of service" describe what happens next. Keep going back until you
  find the line of code that's wrong, and map that.
</p>

<h2>Which view to browse</h2>
<p>
  The matrix up top shows a few of MITRE's views. Top 25 is MITRE's yearly ranking, worked out from
  recently published CVEs and grouped here by pillar. NVD simplified (CWE-1003) is the shallow list
  NVD's analysts map CVEs to, so it's a good shortlist if you want your CVE to sit nicely in NVD.
  OWASP Top 10 suits web apps, and the software development and hardware design views group entries
  by the area of a project they turn up in.
</p>
<p>
  MITRE's own <a href="https://cwe.mitre.org/documents/cwe_usage/guidance.html" rel="external"
    >root cause mapping guidance</a
  > goes into far more depth, and it's worth a read if you file reports regularly.
</p>
<p class="credit">
  CWE content is © The MITRE Corporation, reproduced under the
  <a href="https://cwe.mitre.org/about/termsofuse.html" rel="external">CWE terms of use</a>.
</p>

<style>
  .credit {
    color: var(--text-muted);
    font-size: var(--text-sm);
  }
</style>
