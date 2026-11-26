export const site = {
  name: 'Security Reporting Toolbox',
  url: 'https://security-reporting-toolbox.peng.ly',
  repo: 'https://github.com/NotAFlightRisk/security-reporting-toolbox',
  description:
    'Free tools for the fiddly bits of a security report: find the right CWE, look up CVEs and advisories, score CVSS 3.1 and 4.0, check EPSS and KEV, write version ranges, get PURLs and find a CNA.'
};

const repo = (slug: string) => `https://github.com/NotAFlightRisk/${slug}`;

// the about page's other projects
export const relatedApps = [
  {
    slug: 'fineprint',
    name: 'fineprint',
    about: 'a VPN comparison with no affiliate links and a source for every claim',
    url: 'https://fineprint.peng.ly'
  },
  {
    slug: 'android-rom-compat',
    name: 'Android ROM Compat',
    about: 'which custom ROMs run on your Android phone, and how well',
    url: 'https://android-rom-compat.peng.ly'
  },
  {
    slug: 'token-usage-dashboard',
    name: 'Token Usage Dashboard',
    about: 'see where your Claude Code, Codex and OpenCode tokens go',
    url: repo('token-usage-dashboard')
  },
  {
    slug: 'git-star-ranking',
    name: 'git-star-ranking',
    about: 'where any GitHub user, organisation or repo ranks by stars',
    url: 'https://git-star-ranking.com'
  },
  {
    slug: 'peng-top',
    name: 'peng-top',
    about: 'a system monitor for your browser, like htop with proper graphs',
    url: repo('peng-top')
  },
  {
    slug: 'patchcall',
    name: 'Patchcall',
    about: "security alerts for your self-hosted apps, only when there's a fix",
    url: 'https://patchcall.peng.ly'
  },
  {
    slug: 'parallax',
    name: 'Parallax',
    about: 'merge logs from several machines into one timeline',
    url: 'https://parallax.peng.ly'
  },
  {
    slug: 'awesome-privacy-guide',
    name: 'Awesome Privacy Guide',
    about: 'private alternatives to the apps you use every day',
    url: 'https://awesomeprivacy.peng.ly'
  }
];

// every page lives at its path with no trailing slash, and the home page at /
export const absolute = (path: string) => new URL(path, site.url).href;

export const schemaIds = { website: absolute('/#website'), publisher: absolute('/#publisher') };
