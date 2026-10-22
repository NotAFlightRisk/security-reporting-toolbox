<script lang="ts">
  import Anatomy from '#lib/components/Anatomy.svelte';
  import RangeLine from './RangeLine.svelte';

  const ticks = ['1.4.1', '1.4.2', '1.4.3', '2.0.0', '2.1.0'];
  const ends = [
    {
      name: 'Fixed in',
      about: 'The first release with the fix. Use this whenever there is a fix out.',
      line: { to: 2, inclusive: false, fixed: 2 },
      affected: '< 1.4.3',
      patched: '1.4.3'
    },
    {
      name: 'Last affected',
      about: "The last broken release, when you don't know the next good one yet.",
      line: { to: 1 },
      affected: '<= 1.4.2'
    },
    {
      name: 'No fix yet',
      about: 'Everything from the introduced version onwards.',
      line: { from: 3 },
      affected: '>= 2.0.0'
    },
    {
      name: 'Only one version',
      about: 'That release and nothing else, not even its pre-releases.',
      line: { from: 1, to: 1 },
      affected: '= 1.4.2'
    }
  ];
</script>

<section>
  <h2>How GitHub reads a range</h2>
  <p>
    Each affected product on a GitHub advisory gets exactly one range: a lower bound, an upper
    bound, or both. Two separate ranges means two affected products, which is why the builder gives
    you one block per range.
  </p>
  <figure>
    <Anatomy
      parts={[
        { text: '>= 1.0.0', label: 'lower bound', key: true },
        { text: ', ' },
        { text: '< 1.2.3', label: 'upper bound', key: true }
      ]}
    />
    <RangeLine
      ticks={['0.9.0', '1.0.0', '1.1.0', '1.2.3', '1.3.0']}
      from={1}
      to={3}
      inclusive={false}
      fixed={3}
    />
    <figcaption>
      Lower first, then a comma and a single space, then the upper one. Written the other way round,
      <code>&lt; 1.2.3, &gt;= 1.0.0</code> doesn't work.
    </figcaption>
  </figure>
  <p>
    The operators are <code>&gt;=</code>, <code>&gt;</code>, <code>=</code>, <code>&lt;=</code> and
    <code>&lt;</code>. Leave the lower bound off and it means "every version before". GitHub accepts
    <code>&gt;</code> on your own advisory, but the Advisory Database only takes it as
    <code>&gt; 0</code>, because OSV can't express it - so the builder sticks to <code>&gt;=</code>.
  </p>
</section>

<section>
  <h2>Fixed in, last affected, or one version</h2>
  <p>A filled dot is affected, a hollow one isn't, and green is the first patched version.</p>
  <div class="ends">
    {#each ends as { name, about, line, affected, patched } (name)}
      <figure>
        <figcaption><b>{name}</b> {about}</figcaption>
        <RangeLine {ticks} {...line} />
        <p>
          Affected <code>{affected}</code>, patched
          {#if patched}<code>{patched}</code>{:else}left empty{/if}
        </p>
      </figure>
    {/each}
  </div>
</section>

<section>
  <h2>Mistakes that catch people out</h2>
  <ul>
    <li>
      Pre-releases sort before their release, so <code>&lt; 2.0.0</code> also marks
      <code>2.0.0-rc.1</code> as affected. If the fix landed in an rc, make the rc the fix.
    </li>
    <li>
      Writing <code>&lt; 1.5.0</code> and then saying 1.5.1 is patched. If 1.5.0 is broken too, the
      range is <code>&lt;= 1.5.0</code> (or <code>&lt; 1.5.1</code>).
    </li>
    <li>
      <code>&lt; 1.2</code> and <code>&lt; 1.2.0</code> are the same thing in PyPI and Maven, but
      <code>1.2</code> isn't a version at all in SemVer, so npm and crates.io want all three parts.
    </li>
    <li>
      PyPI post releases come after the release (<code>1.0.post1</code> &gt; <code>1.0</code>) and
      <code>1.0rc1</code> comes before it. A fix shipped as a post release needs the post release as the
      fix.
    </li>
    <li>
      Maven qualifiers sort alphabetically after the numbers. Guava ships
      <code>32.0.0-android</code> and <code>32.0.0-jre</code>, so the patched version is
      <code>32.0.0-android</code>, which covers both.
    </li>
    <li>
      Go tags have a <code>v</code> but GitHub and OSV write Go versions without it, so
      <code>v1.9.1</code> goes in as <code>1.9.1</code>. The builder drops it for you.
    </li>
  </ul>
</section>

<section>
  <h2>How versions get compared</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr><th scope="col">Rules</th><th scope="col">Used for</th></tr>
      </thead>
      <tbody>
        <tr><th scope="row">SemVer</th><td>npm, crates.io, Go, Pub, Hex and Swift</td></tr>
        <tr><th scope="row">PEP 440</th><td>PyPI</td></tr>
        <tr><th scope="row">ComparableVersion</th><td>Maven</td></tr>
        <tr><th scope="row">Gem::Version</th><td>RubyGems</td></tr>
        <tr><th scope="row">Four-part versions</th><td>NuGet</td></tr>
        <tr>
          <th scope="row">A best guess</th>
          <td>
            Composer and GitHub Actions. Numbers come first and letters after them count as
            pre-releases, and the tester says when it's guessing.
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <p>
    Published versions come from deps.dev, pub.dev or hex.pm. Composer, Swift and Actions can't be
    checked from a browser.
  </p>
</section>

<section>
  <h2>Further reading</h2>
  <ul>
    <li>
      <a
        href="https://docs.github.com/en/code-security/tutorials/fix-reported-vulnerabilities/write-security-advisories"
        target="_blank"
        rel="external">GitHub: best practices for writing security advisories</a
      >
    </li>
    <li>
      <a href="https://ossf.github.io/osv-schema/" target="_blank" rel="external">The OSV schema</a>
    </li>
    <li>
      <a
        href="https://maven.apache.org/pom.html#Version_Order_Specification"
        target="_blank"
        rel="external">Maven version order</a
      >,
      <a href="https://peps.python.org/pep-0440/" target="_blank" rel="external">PEP 440</a> and
      <a href="https://semver.org/" target="_blank" rel="external">SemVer 2.0</a>
    </li>
  </ul>
</section>

<style>
  .ends {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 19rem), 1fr));
    gap: var(--space-3);

    & figure {
      padding: var(--space-3);
      border: var(--hairline) solid var(--line);
      border-radius: var(--radius);
      background: var(--surface);
    }

    & figcaption b {
      display: block;
      color: var(--text);
    }

    & p {
      font-size: var(--text-sm);
    }
  }
</style>
