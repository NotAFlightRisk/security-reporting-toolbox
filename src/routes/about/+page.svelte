<script lang="ts">
  import Seo from '#lib/components/Seo.svelte';
  import { site } from '#lib/site.ts';
  import { tool, type ToolId } from '#lib/tools.ts';

  const analytics = Boolean(import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT);
  const errors = Boolean(import.meta.env.PUBLIC_SENTRY_DSN);

  const steps: { id: ToolId; text: string }[] = [
    { id: 'cwe', text: 'Pin down the weakness. Name the root cause, not the impact.' },
    { id: 'cvss', text: 'Score it. CVSS 4.0 if the place you report to takes it, 3.1 if not.' },
    { id: 'package', text: 'Get the package name exactly right, plus its PURL.' },
    { id: 'versions', text: 'Write the affected and patched versions in the format GitHub wants.' },
    { id: 'cna', text: "Work out who can give it a CVE, if it hasn't got one." },
    { id: 'cve', text: 'Already public? Check what NVD, GitHub and OSV say, plus EPSS and KEV.' }
  ];

  const sources = [
    {
      name: 'MITRE CWE',
      url: 'https://cwe.mitre.org/data/downloads.html',
      used: 'CWE explorer',
      fresh: 'Bundled with each release of this site. MITRE publishes a few versions a year.'
    },
    {
      name: 'CVE Program (CVE Services)',
      url: 'https://www.cve.org/',
      used: 'CVE lookup, CNA directory',
      fresh: "Live. The CNA list comes from the CVE Program's own website data."
    },
    {
      name: 'NVD',
      url: 'https://nvd.nist.gov/developers/vulnerabilities',
      used: 'CVE lookup and search, KEV cross-check',
      fresh: 'Live. Limited to 5 requests every 30 seconds without an API key.'
    },
    {
      name: 'GitHub Advisory Database',
      url: 'https://docs.github.com/en/rest/security-advisories/global-advisories',
      used: 'CVE lookup (GHSAs)',
      fresh: 'Live. GitHub allows 60 requests an hour per IP address without signing in.'
    },
    {
      name: 'OSV',
      url: 'https://osv.dev/docs/',
      used: 'CVE lookup (aliases and ranges)',
      fresh: 'Live.'
    },
    {
      name: 'FIRST EPSS',
      url: 'https://api.first.org/epss/',
      used: 'EPSS lookup, CVE lookup',
      fresh: 'Live. Scores update once a day.'
    },
    {
      name: 'FIRST CVSS',
      url: 'https://www.first.org/cvss/',
      used: 'CVSS calculator',
      fresh: 'The 3.1 and 4.0 specifications, scored in your browser.'
    },
    {
      name: 'CISA KEV',
      url: 'https://www.cisa.gov/known-exploited-vulnerabilities-catalog',
      used: 'KEV checker, CVE lookup',
      fresh:
        "CISA's GitHub copy, usually a day behind cisa.gov. Single lookups also check NVD, which carries the KEV fields too."
    },
    {
      name: 'deps.dev and the registries',
      url: 'https://docs.deps.dev/api/v3/',
      used: 'Package lookup, versions builder',
      fresh: 'Live, from deps.dev, npm, PyPI, crates.io and the other registries.'
    }
  ];
</script>

<Seo
  title="About and sources"
  description="Where every number in the Security Reporting Toolbox comes from, how fresh it is, and what happens to what you type."
  path="/about"
  crumbs={[{ name: 'About and sources', path: '/about' }]}
/>

<article class="about">
  <h1>About and sources</h1>
  <p>
    {site.name} is a set of small, free tools for the side quests of writing a vulnerability report. It
    has no backend: each tool asks the official source straight from your browser, so what you look up
    goes to that source and nowhere else.
  </p>

  <h2>A report, start to finish</h2>
  <ol class="steps">
    {#each steps as { id, text } (id)}
      {@const { path, title } = tool(id)}
      <li><b><a href={path}>{title}</a></b> {text}</li>
    {/each}
  </ol>

  <h2>Where the data comes from</h2>
  <div class="scroll">
    <table>
      <thead>
        <tr
          ><th scope="col">Source</th><th scope="col">Used by</th><th scope="col">How fresh</th></tr
        >
      </thead>
      <tbody>
        {#each sources as source (source.name)}
          <tr>
            <th scope="row"
              ><a href={source.url} target="_blank" rel="external">{source.name}</a></th
            >
            <td>{source.used}</td>
            <td>{source.fresh}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <p>
    When a source can't be reached or turns us away, the tool says so, and never treats it as "no
    record". A missing EPSS score and a broken EPSS API are different things, and they look
    different here.
  </p>

  <h2>Privacy</h2>
  <ul>
    <li>No accounts, no cookies, and nothing you type is stored by us.</li>
    <li>
      Lookups go from your browser to the source you asked (NVD, GitHub and so on), under their own
      privacy policies.
    </li>
    {#if analytics}
      <li>
        Visits are counted by a self-hosted, cookieless Plausible, which records the page but not
        what you searched for.
      </li>
    {/if}
    {#if errors}
      <li>
        If the site breaks, the error goes to our own Bugsink so it can be fixed. No personal data
        is attached.
      </li>
    {/if}
  </ul>

  <h2>Spotted something wrong?</h2>
  <p>
    It's open source under MIT. <a
      href="{site.repo}/issues/new/choose"
      target="_blank"
      rel="external">Open an issue</a
    >
    or send a fix on <a href={site.repo} target="_blank" rel="external">GitHub</a>.
  </p>
</article>

<style>
  .about {
    display: grid;
    gap: var(--space-4);
    max-width: var(--measure);
    padding-block: var(--space-5);

    & h1 {
      font-size: var(--text-xl);
    }

    & h2 {
      margin-top: var(--space-4);
      font-size: var(--text-lg);
    }

    & ul {
      display: grid;
      gap: var(--space-1);
      margin: 0;
      padding-left: var(--space-5);
    }
  }

  table {
    min-width: 36rem;
  }
</style>
