<h2>How GitHub reads a range</h2>
<p>
  Each affected product on a GitHub advisory gets exactly one range. A range is a lower bound, an
  upper bound, or both - lower first, then a comma and a single space, then the upper one. So
  <code>&gt;= 1.0.0, &lt; 1.2.3</code> works and <code>&lt; 1.2.3, &gt;= 1.0.0</code> doesn't. Two separate
  ranges means two affected products, which is why the builder gives you one block per range.
</p>
<p>
  The operators are <code>&gt;=</code>, <code>&gt;</code>, <code>=</code>, <code>&lt;=</code> and
  <code>&lt;</code>. Leave the lower bound off and it means "every version before". GitHub accepts
  <code>&gt;</code> on your own advisory, but the Advisory Database only takes it as
  <code>&gt; 0</code>, because OSV can't express it - so the builder sticks to <code>&gt;=</code>.
</p>

<h2>Fixed in, last affected, or one version</h2>
<dl>
  <dt>Fixed in</dt>
  <dd>
    The first release with the fix. You get <code>&lt; 1.4.3</code> plus <code>1.4.3</code> in "Patched
    versions". Use this whenever there's a fix out.
  </dd>
  <dt>Last affected</dt>
  <dd>
    The last broken release, when you don't know the next good one yet. You get <code
      >&lt;= 1.4.2</code
    >
    and an empty patched field.
  </dd>
  <dt>No fix yet</dt>
  <dd>Everything from the introduced version onwards, like <code>&gt;= 2.0.0</code>.</dd>
  <dt>Only one version</dt>
  <dd>
    <code>= 1.4.2</code> means that release and nothing else, not even its pre-releases.
  </dd>
</dl>

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
    Maven qualifiers sort alphabetically after the numbers. Guava ships <code>32.0.0-android</code>
    and
    <code>32.0.0-jre</code>, so the patched version is <code>32.0.0-android</code>, which covers
    both.
  </li>
  <li>
    Go tags have a <code>v</code> but GitHub and OSV write Go versions without it, so
    <code>v1.9.1</code> goes in as <code>1.9.1</code>. The builder drops it for you.
  </li>
</ul>

<h2>How versions get compared</h2>
<p>
  Each ecosystem uses its own rules: SemVer for npm, crates.io, Go, Pub, Hex and Swift, PEP 440 for
  PyPI, Maven's ComparableVersion, Gem::Version for RubyGems and NuGet's four-part versions.
  Composer and GitHub Actions get a best guess (numbers first, letters after them count as
  pre-releases), and the tester says so when it's guessing. Published versions come from deps.dev,
  pub.dev or hex.pm; Composer, Swift and Actions can't be checked from a browser.
</p>

<h2>Further reading</h2>
<ul>
  <li>
    <a
      href="https://docs.github.com/en/code-security/tutorials/fix-reported-vulnerabilities/write-security-advisories"
      rel="external">GitHub: best practices for writing security advisories</a
    >
  </li>
  <li><a href="https://ossf.github.io/osv-schema/" rel="external">The OSV schema</a></li>
  <li>
    <a href="https://maven.apache.org/pom.html#Version_Order_Specification" rel="external"
      >Maven version order</a
    >,
    <a href="https://peps.python.org/pep-0440/" rel="external">PEP 440</a> and
    <a href="https://semver.org/" rel="external">SemVer 2.0</a>
  </li>
</ul>
