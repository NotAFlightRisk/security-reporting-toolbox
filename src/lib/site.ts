export const site = {
  name: 'Security Reporting Toolbox',
  url: 'https://security-reporting-toolbox.peng.ly',
  repo: 'https://github.com/NotAFlightRisk/security-reporting-toolbox',
  description:
    'Free tools for the fiddly bits of a security report: find the right CWE, look up CVEs and advisories, score CVSS 3.1 and 4.0, check EPSS and KEV, write version ranges, get PURLs and find a CNA.'
};

// every page lives at its path with no trailing slash, and the home page at /
export const absolute = (path: string) => new URL(path, site.url).href;

export const schemaIds = { website: absolute('/#website'), publisher: absolute('/#publisher') };
