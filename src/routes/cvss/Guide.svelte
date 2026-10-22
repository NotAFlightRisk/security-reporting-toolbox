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

<section>
  <h2>Scoring without fooling yourself</h2>
  <p>
    Score the vulnerability as it ships, not your own setup. The base score is for the reasonable
    worst case: the most likely config in which the bug is actually exploitable, with no extra
    defences assumed and no chaining with other bugs.
  </p>
  <div class="scroll">
    <table>
      <thead>
        <tr><th scope="col">When</th><th scope="col">3.1</th><th scope="col">4.0</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>Anyone can sign up for an account, then exploit it</td>
          <td><code>PR:L</code>, not <code>PR:N</code></td>
          <td><code>PR:L</code></td>
        </tr>
        <tr>
          <td>
            The attacker has to win a race, or something else they can't control. "It's a bit
            fiddly" doesn't count.
          </td>
          <td><code>AC:H</code></td>
          <td><code>AT:P</code></td>
        </tr>
        <tr>
          <td>A crash you can trigger again and again</td>
          <td><code>A:H</code></td>
          <td><code>VA:H</code></td>
        </tr>
        <tr>
          <td>A slowdown</td>
          <td>Usually <code>A:L</code></td>
          <td>Usually <code>VA:L</code></td>
        </tr>
        <tr>
          <td>XSS, which hits the victim's browser, not the server</td>
          <td><code>S:C</code> with <code>C:L/I:L</code></td>
          <td><code>VC:N/VI:N</code> with <code>SC:L/SI:L</code></td>
        </tr>
      </tbody>
    </table>
  </div>
  <p>Impact is about what the attacker gets, not what the bug is.</p>
</section>

<section>
  <h2>Scope and subsequent systems</h2>
  <p>
    3.1's Scope asks whether the impact crosses a security boundary, like a guest escaping its VM or
    a script running in someone's browser. 4.0 dropped it. Instead you rate impact twice: once on
    the vulnerable system and once on anything downstream.
  </p>
  <figure class="scope">
    <b>3.1</b>
    <ol class="flow">
      <li><b>Web app</b> The vulnerable component</li>
      <li>
        <b>Victim's browser</b> Crossing into it is <code>S:C</code>. Impact is rated once, on
        whichever is hit worse.
      </li>
    </ol>
    <b>4.0</b>
    <ol class="flow">
      <li><b>Web app</b> Vulnerable system, <code>VC:N/VI:N</code></li>
      <li><b>Victim's browser</b> Subsequent system, <code>SC:L/SI:L</code></li>
    </ol>
    <figcaption>The same XSS, scored both ways.</figcaption>
  </figure>
  <p>
    Hardware, firmware and the OS on one device usually count as one system in 4.0, which is why
    some old scope-changed scores drop a bit.
  </p>
</section>

<section>
  <h2>What changed in 4.0</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr><td></td><th scope="col">3.1</th><th scope="col">4.0</th></tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">Races and man-in-the-middle</th>
          <td>Attack Complexity</td>
          <td>The new Attack Requirements (<code>AT</code>)</td>
        </tr>
        <tr>
          <th scope="row">User Interaction</th>
          <td>None or Required</td>
          <td>
            None, Passive or Active. FIRST scores a stored XSS <code>UI:P</code> and a reflected one
            <code>UI:A</code>.
          </td>
        </tr>
        <tr>
          <th scope="row">Scope</th>
          <td>Unchanged or Changed</td>
          <td>Gone, replaced by subsequent system impact</td>
        </tr>
        <tr>
          <th scope="row">Temporal, now Threat</th>
          <td>Exploit Code Maturity, Remediation Level, Report Confidence</td>
          <td>Just Exploit Maturity, about reported attacks rather than code quality</td>
        </tr>
        <tr>
          <th scope="row">Supplemental</th>
          <td>None</td>
          <td>Safety, Automatable, Recovery and friends. Context only, never the score.</td>
        </tr>
        <tr>
          <th scope="row">The maths</th>
          <td>A formula</td>
          <td>A lookup table of expert-ranked combinations</td>
        </tr>
      </tbody>
    </table>
  </div>
  <p>
    So don't expect a 3.1 score to carry over. The converter above does the mechanical bits and
    tells you which calls it couldn't make. Treat what it gives you as a first draft.
  </p>
</section>

<section>
  <h2>Quick answers</h2>
  <div>
    {#each answers as { question, answer } (question)}
      <details>
        <summary>{question}</summary>
        <p>{answer}</p>
      </details>
    {/each}
  </div>
</section>

<section>
  <h2>The source material</h2>
  <ul>
    <li>
      <a
        href="https://www.first.org/cvss/v4.0/specification-document"
        target="_blank"
        rel="external"
      >
        CVSS 4.0 specification
      </a>
      and its
      <a href="https://www.first.org/cvss/v4.0/user-guide" target="_blank" rel="external"
        >user guide</a
      >
    </li>
    <li>
      <a
        href="https://www.first.org/cvss/v3.1/specification-document"
        target="_blank"
        rel="external"
      >
        CVSS 3.1 specification
      </a>
      and its
      <a href="https://www.first.org/cvss/v3.1/user-guide" target="_blank" rel="external"
        >user guide</a
      >
    </li>
    <li>
      Worked examples for
      <a href="https://www.first.org/cvss/v4.0/examples" target="_blank" rel="external">4.0</a>
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
</section>

<style>
  .scope {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
    gap: var(--space-3) var(--space-4);

    & figcaption {
      grid-column: 1 / -1;
    }
  }
</style>
