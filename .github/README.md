<h1 align="center">Security Reporting Toolbox</h1>
<p align="center">
<i>The fiddly bits of writing a security report, in one place</i>
<br />
<b>🌐 <a href="https://security-reporting-toolbox.peng.ly/">security-reporting-toolbox.peng.ly</a></b><br />
</p>

<details>
  <summary>Contents</summary>

- [About](#about)
- [Usage](#usage)
- [Deployment](#deployment)
- [Development](#development)
- [Credits](#credits)

</details>

## About

Writing up a vulnerability means a dozen small side quests - which CWE, what's the CVSS score, is it in KEV, what's the exact package name, how do I write "everything before 2.4.1" so GitHub understands it, and who do I even ask for a CVE. This puts all of those in one place, with each tool talking straight to the official source.

| Tool                                                                    | What it does                                                                            | Source                    |
| ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------- | ------------------------- |
| [CWE explorer](https://security-reporting-toolbox.peng.ly/cwe)          | Find the right weakness, with MITRE's mapping guidance, plus Top 25 and OWASP views     | MITRE CWE                 |
| [CVE lookup](https://security-reporting-toolbox.peng.ly/cve)            | CVEs and GHSAs side by side from every source, with aliases cross-referenced            | CVE.org, NVD, GitHub, OSV |
| [CVSS calculator](https://security-reporting-toolbox.peng.ly/cvss)      | Score 3.1 and 4.0, decode and check vectors, rough conversion between them              | FIRST                     |
| [EPSS lookup](https://security-reporting-toolbox.peng.ly/epss)          | Exploit probability and percentile for a whole list of CVEs, with history               | FIRST EPSS                |
| [KEV checker](https://security-reporting-toolbox.peng.ly/kev)           | Is it known exploited? Plus search and filter the whole catalogue                       | CISA KEV                  |
| [Versions builder](https://security-reporting-toolbox.peng.ly/versions) | Affected and patched version fields for GitHub advisories, tested against real releases | deps.dev, registries      |
| [Package lookup](https://security-reporting-toolbox.peng.ly/package)    | Find a package across ecosystems, check its name, get versions and its PURL             | deps.dev, registries      |
| [CNA directory](https://security-reporting-toolbox.peng.ly/cna)         | Who can assign a CVE for a product, and how to ask them                                 | CVE Program               |

There's no backend and no accounts. Everything runs in your browser, and "not found" never gets mixed up with "the source is down".

---

## Usage

Just open the site and paste whatever you've got into the box on the home page - a CVE, GHSA, CWE, CVSS vector, package name, PURL or link - and it'll send you to the right tool.

Every tool keeps its state in the URL, so you can link straight to a result:

```
/cve?id=CVE-2021-44228
/cvss?vector=CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H
/epss?cve=CVE-2021-44228,CVE-2023-4863
/package?q=pkg:npm/express
```

---

## Deployment

It's a static site, so it'll run anywhere that can serve a folder of files.

### Option 1: Vercel or Cloudflare

Fork the repo, then import it into Vercel. Or use the button 👇

[![1-Click Deploy to Vercel](https://img.shields.io/badge/Deploy-Vercel-ffffff?style=for-the-badge&logo=vercel&labelColor=1b2744)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2FNotAFlightRisk%2Fsecurity-reporting-toolbox&demo-title=Security%20Reporting%20Toolbox&demo-url=https%3A%2F%2Fsecurity-reporting-toolbox.peng.ly)

For Cloudflare, change the domain in `wrangler.jsonc` to your own, then run `npm run build && npx wrangler deploy`.

### Option 2: Docker

There's a multi-arch image on DockerHub ([`notaflightrisk/security-reporting-toolbox`](https://hub.docker.com/r/notaflightrisk/security-reporting-toolbox)) and GHCR ([`ghcr.io/notaflightrisk/security-reporting-toolbox`](https://github.com/NotAFlightRisk/security-reporting-toolbox/pkgs/container/security-reporting-toolbox)). It's nginx serving the built site on port 8080:

```shell
docker run -p 8080:8080 notaflightrisk/security-reporting-toolbox
```

### Option 3: From a release

Grab `site.zip` from the [latest release](https://github.com/NotAFlightRisk/security-reporting-toolbox/releases/latest), unzip it, and serve the folder with anything that maps `/cwe` to `cwe.html`. For a quick look, `npx serve site` does the job.

### Option 4: Build from source

Follow the [Development](#development) steps, then `npm run build`. The site lands in `build/`.

---

## Development

You'll need [Node](https://nodejs.org/) 22 or newer, plus [Git](https://git-scm.com/). It's a [SvelteKit](https://svelte.dev/docs/kit) app.

```bash
git clone git@github.com:NotAFlightRisk/security-reporting-toolbox.git
cd security-reporting-toolbox
npm install
npm run dev
```

The dev server is then on [localhost:5173](http://localhost:5173).<br>
The other scripts you'll want are `npm run check` (types), `npm test` (tests) and `npm run preview` (serve a production build locally).

The CWE data is bundled in `src/lib/data/cwe.json`. To pull a newer release from MITRE, run `npm run data:cwe` (needs Python 3). A scheduled workflow opens an issue when there's a new one.

Alternatively, build the container with `docker build -t security-reporting-toolbox .`

[![Open in VS Code](https://img.shields.io/badge/CodeSpaces-Try_Live-007ACC?style=for-the-badge&logo=vscodium&labelColor=1b2744)](https://codespaces.new/NotAFlightRisk/security-reporting-toolbox)

---

## Credits

The data belongs to the people who keep it up to date: [MITRE](https://cwe.mitre.org/) and the [CVE Program](https://www.cve.org/), [NIST's NVD](https://nvd.nist.gov/), the [GitHub Advisory Database](https://github.com/advisories), [OSV](https://osv.dev/), [FIRST](https://www.first.org/) for CVSS and EPSS, [CISA](https://www.cisa.gov/known-exploited-vulnerabilities-catalog) for KEV, and [deps.dev](https://deps.dev/).

##### Contributors

[![contributors badge](https://readme-contribs.as93.net/contributors/NotAFlightRisk/security-reporting-toolbox?shape=squircle)](https://github.com/NotAFlightRisk/security-reporting-toolbox/graphs/contributors)

---

<!-- License + Copyright -->
<p  align="center">
  <a href="https://github.com/NotAFlightRisk"><img width="64" src="https://pixelflare.cc/iain/gif/penguin-dance.gif" /></a><br>
  <sup>
    <i>Licensed under <a href="../LICENSE">MIT</a>, © <a href="https://peng.ly">NotAFlightRisk</a> 2026</i>
  </sup>
</p>

<!--
oooh, hello there! hope you're having a nice day :)
   |\__      |\___
 (:> __)X  (:o ___(
   |/        |/
-->
