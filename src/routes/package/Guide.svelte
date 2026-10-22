<h2>What a Package URL is</h2>
<p>
  A Package URL (PURL) names one package in one ecosystem with no wiggle room:
  <code>pkg:npm/%40sveltejs/kit@2.5.0</code>, <code>pkg:pypi/django@4.2.7</code>,
  <code>pkg:maven/org.apache.logging.log4j/log4j-core@2.17.1</code>. It's what OSV, CycloneDX, SPDX
  and most scanners use to match a report to the thing people actually install, so putting one in
  your report saves everyone a round of "which <code>requests</code> did you mean?".
</p>
<p>
  The shape is <code>pkg:type/namespace/name@version?qualifiers#subpath</code>. Only the type and
  name are required. The scope on an npm package is percent-encoded (<code>@</code> becomes
  <code>%40</code>), and the Maven group goes in the namespace.
</p>

<h2>Names work differently everywhere</h2>
<dl>
  <dt>PyPI</dt>
  <dd>
    Case and runs of <code>-</code>, <code>_</code> and <code>.</code> don't count, so
    <code>Django_Allauth</code> and <code>django-allauth</code> are the same project. Advisories and PURLs
    use the lowercase, hyphenated form.
  </dd>
  <dt>npm</dt>
  <dd>
    Scoped packages are <code>@scope/name</code>. New names have to be lowercase, but a few old ones
    aren't, and <code>JSONStream</code> and <code>jsonstream</code> really are different packages.
  </dd>
  <dt>Maven</dt>
  <dd>
    Packages are <code>groupId:artifactId</code>, like <code>com.google.guava:guava</code>. The
    artifact on its own is ambiguous.
  </dd>
  <dt>Go</dt>
  <dd>
    The name is the module path, starting with a domain: <code>github.com/gin-gonic/gin</code> or
    <code>golang.org/x/net</code>. Major versions from v2 up add a suffix, like <code>/v2</code>.
  </dd>
  <dt>Composer, Actions and Swift</dt>
  <dd>
    <code>vendor/package</code>, <code>owner/repo</code>, and the repo URL without
    <code>https://</code> respectively. None of them have a registry that answers browsers, so we can
    build the PURL but not list versions.
  </dd>
</dl>

<h2>What you can paste</h2>
<p>
  A bare name gets checked across npm, PyPI, RubyGems, crates.io, NuGet, Pub and Hex at once. A
  PURL,
  <code>group:artifact</code>, an <code>@scope/name</code> or a module path goes straight to the right
  ecosystem, and so does a registry page from npmjs.com, pypi.org, crates.io, mvnrepository.com, central.sonatype.com,
  rubygems.org, nuget.org, packagist.org, pkg.go.dev, pub.dev or hex.pm. A GitHub repo could be a Go module,
  a Swift package or an Action, so you'll get asked which.
</p>
<p>
  Versions, release dates, licences and repo links come from
  <a href="https://deps.dev/" target="_blank" rel="external">deps.dev</a> (Google's Open Source Insights),
  or from pub.dev and hex.pm directly.
</p>

<h2>Further reading</h2>
<ul>
  <li>
    <a href="https://github.com/package-url/purl-spec" target="_blank" rel="external"
      >The purl spec</a
    >
  </li>
  <li>
    <a
      href="https://packaging.python.org/en/latest/specifications/name-normalization/"
      target="_blank"
      rel="external">Python package name normalisation</a
    >
  </li>
  <li>
    <a href="https://go.dev/ref/mod#module-path" target="_blank" rel="external">Go module paths</a>
  </li>
</ul>
