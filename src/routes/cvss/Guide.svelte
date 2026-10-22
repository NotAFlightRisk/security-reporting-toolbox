<script lang="ts" module>
  const answers = [
    {
      question: 'Should I use CVSS 3.1 or 4.0?',
      answer:
        "4.0 if whoever you're reporting to takes it, since it's the current version and splits impact more honestly. GitHub advisories take both. Plenty of vendor forms and older tooling still only know 3.1, so check before you send."
    },
    {
      question: "What's the difference between CVSS-B, CVSS-BT and CVSS-BTE?",
      answer:
        'They say which metric groups went into a 4.0 score: B is base only, T adds threat (exploit maturity) and E adds environmental. A report from a researcher is nearly always CVSS-B, because threat and environment belong to whoever is defending.'
    },
    {
      question: 'Does GitHub accept CVSS 4.0 vectors?',
      answer:
        "Yes. GitHub's docs say the Advisory Database supports CVSS 3.1 and 4.0, plus 3.0 on CVEs it imports from elsewhere."
    }
  ];

  export const faq = {
    '@type': 'FAQPage',
    mainEntity: answers.map(({ question, answer }) => ({
      '@type': 'Question',
      name: question,
      acceptedAnswer: { '@type': 'Answer', text: answer }
    }))
  };
</script>

<h2>Scoring without fooling yourself</h2>
<p>
  Score the vulnerability as it ships, not your own setup. The base score is for the reasonable
  worst case: the most likely config in which the bug is actually exploitable, with no extra
  defences assumed and no chaining with other bugs.
</p>
<ul>
  <li>
    If anyone can sign up for an account and then exploit it, that's still <code>PR:L</code>, not
    <code>PR:N</code>.
  </li>
  <li>
    <code>AC:H</code> is for conditions the attacker can't control, like winning a race. "It's a bit fiddly"
    doesn't count.
  </li>
  <li>
    Impact is about what the attacker gets, not what the bug is. A crash you can trigger forever is
    <code>A:H</code>, a slowdown is usually <code>A:L</code>.
  </li>
  <li>
    XSS hits the victim's browser, not the server. In 3.1 that's usually <code>S:C</code> with
    <code>C:L/I:L</code>, in 4.0 it's <code>VC:N/VI:N</code> with <code>SC:L/SI:L</code>.
  </li>
</ul>

<h2>Scope and subsequent systems</h2>
<p>
  3.1's Scope asks whether the impact crosses a security boundary, like a guest escaping its VM or a
  script running in someone's browser. 4.0 dropped it. Instead you rate impact twice: once on the
  vulnerable system (<code>VC/VI/VA</code>) and once on anything downstream (<code>SC/SI/SA</code>).
  Hardware, firmware and the OS on one device usually count as one system in 4.0, which is why some
  old scope-changed scores drop a bit.
</p>

<h2>What changed in 4.0</h2>
<ul>
  <li>
    Attack Requirements (<code>AT</code>) is new. Races and man-in-the-middle positions moved here
    out of Attack Complexity.
  </li>
  <li>
    User Interaction is now None, Passive or Active. FIRST's own examples score a stored XSS as
    <code>UI:P</code> and a reflected one as <code>UI:A</code>.
  </li>
  <li>
    Temporal became Threat, with one metric, Exploit Maturity, which is about reported attacks
    rather than code quality. Remediation Level and Report Confidence are gone.
  </li>
  <li>
    Supplemental metrics (Safety, Automatable, Recovery and friends) add context but never change
    the score.
  </li>
  <li>
    The maths is different too. 4.0 looks scores up from a table of expert-ranked combinations
    instead of a formula, so don't expect a 3.1 score to carry over.
  </li>
</ul>
<p>
  The converter above does the mechanical bits and tells you which calls it couldn't make. Treat
  what it gives you as a first draft.
</p>

<h2>Quick answers</h2>
{#each answers as { question, answer } (question)}
  <h3>{question}</h3>
  <p>{answer}</p>
{/each}

<h2>The source material</h2>
<ul>
  <li>
    <a href="https://www.first.org/cvss/v4.0/specification-document" target="_blank" rel="external">
      CVSS 4.0 specification
    </a>
    and its
    <a href="https://www.first.org/cvss/v4.0/user-guide" target="_blank" rel="external"
      >user guide</a
    >
  </li>
  <li>
    <a href="https://www.first.org/cvss/v3.1/specification-document" target="_blank" rel="external">
      CVSS 3.1 specification
    </a>
    and its
    <a href="https://www.first.org/cvss/v3.1/user-guide" target="_blank" rel="external"
      >user guide</a
    >
  </li>
  <li>
    Worked examples for <a
      href="https://www.first.org/cvss/v4.0/examples"
      target="_blank"
      rel="external">4.0</a
    >
    and <a href="https://www.first.org/cvss/v3.1/examples" target="_blank" rel="external">3.1</a>,
    which is what this calculator is tested against
  </li>
  <li>
    Scores are worked out with the open source
    <a
      href="https://github.com/org-metaeffekt/metaeffekt-universal-cvss-calculator"
      target="_blank"
      rel="external"
    >
      metaeffekt CVSS calculator
    </a>
  </li>
</ul>
