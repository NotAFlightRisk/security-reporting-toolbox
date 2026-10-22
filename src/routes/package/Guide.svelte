<script lang="ts">
  import Anatomy from '#lib/components/Anatomy.svelte';
</script>

<section>
  <h2>What a Package URL is</h2>
  <p>
    A Package URL (PURL) names one package in one ecosystem with no wiggle room. It's what OSV,
    CycloneDX, SPDX and most scanners use to match a report to the thing people actually install, so
    putting one in your report saves everyone a round of "which <code>requests</code> did you mean?".
  </p>
  <figure>
    <Anatomy
      parts={[
        { text: 'pkg:', label: 'scheme' },
        { text: 'maven', label: 'type', key: true },
        { text: '/org.apache.logging.log4j', label: 'namespace' },
        { text: '/log4j-core', label: 'name', key: true },
        { text: '@2.17.1', label: 'version' }
      ]}
    />
    <figcaption>
      Only the type and name are required. The full shape is
      <code>pkg:type/namespace/name@version?qualifiers#subpath</code>.
    </figcaption>
  </figure>
  <p>
    The Maven group goes in the namespace. An npm scope does too, percent-encoded so <code>@</code>
    becomes <code>%40</code>: <code>pkg:npm/%40sveltejs/kit@2.5.0</code>. Plenty have no namespace
    at all, like <code>pkg:pypi/django@4.2.7</code>.
  </p>
</section>

<section>
  <h2>Names work differently everywhere</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr>
          <th scope="col">Ecosystem</th>
          <th scope="col">Looks like</th>
          <th scope="col">Watch out for</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <th scope="row">PyPI</th>
          <td><code>django-allauth</code></td>
          <td>
            Case and runs of <code>-</code>, <code>_</code> and <code>.</code> don't count, so
            <code>Django_Allauth</code> is the same project. Advisories and PURLs use the lowercase, hyphenated
            form.
          </td>
        </tr>
        <tr>
          <th scope="row">npm</th>
          <td><code>@scope/name</code></td>
          <td>
            New names have to be lowercase, but a few old ones aren't, and <code>JSONStream</code>
            and
            <code>jsonstream</code> really are different packages.
          </td>
        </tr>
        <tr>
          <th scope="row">Maven</th>
          <td><code>com.google.guava:guava</code></td>
          <td>It's <code>groupId:artifactId</code>. The artifact on its own is ambiguous.</td>
        </tr>
        <tr>
          <th scope="row">Go</th>
          <td><code>golang.org/x/net</code></td>
          <td>
            The module path starts with a domain. Major versions from v2 up add a suffix, like
            <code>/v2</code>.
          </td>
        </tr>
        <tr>
          <th scope="row">Composer</th>
          <td><code>vendor/package</code></td>
          <td rowspan="3">
            None of these have a registry that answers browsers, so we can build the PURL but not
            list versions.
          </td>
        </tr>
        <tr>
          <th scope="row">Actions</th>
          <td><code>owner/repo</code></td>
        </tr>
        <tr>
          <th scope="row">Swift</th>
          <td><code>github.com/owner/repo</code></td>
        </tr>
      </tbody>
    </table>
  </div>
</section>

<section>
  <h2>What you can paste</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr><th scope="col">Paste</th><th scope="col">And it goes</th></tr>
      </thead>
      <tbody>
        <tr>
          <td>A bare name, like <code>requests</code></td>
          <td>To npm, PyPI, RubyGems, crates.io, NuGet, Pub and Hex at once</td>
        </tr>
        <tr>
          <td>
            A PURL, <code>group:artifact</code>, <code>@scope/name</code>, a Go module path or a
            registry page
          </td>
          <td>Straight to the right ecosystem</td>
        </tr>
        <tr>
          <td>A GitHub repo</td>
          <td
            >Nowhere yet: it could be a Go module, a Swift package or an Action, so you'll get asked</td
          >
        </tr>
      </tbody>
    </table>
  </div>
  <p>
    Registry pages from npmjs.com, pypi.org, crates.io, mvnrepository.com, central.sonatype.com,
    rubygems.org, nuget.org, packagist.org, pkg.go.dev, pub.dev and hex.pm all work. Versions,
    release dates, licences and repo links come from
    <a href="https://deps.dev/" target="_blank" rel="external">deps.dev</a> (Google's Open Source Insights),
    or from pub.dev and hex.pm directly.
  </p>
</section>

<section>
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
      <a href="https://go.dev/ref/mod#module-path" target="_blank" rel="external">Go module paths</a
      >
    </li>
  </ul>
</section>
