import { ecosystem, ecosystems, type Ecosystem, type EcosystemId } from '#lib/ecosystems.ts';
import { buildPurl, parsePurl, PurlError } from '#lib/purl.ts';

/** the canonical PURL for a package as its ecosystem names it */
export function purlFor(ecosystem: Ecosystem, name: string, version?: string) {
  const split = (at: number) => ({
    namespace: name.slice(0, at) || null,
    name: name.slice(at + 1)
  });
  let parts: { namespace: string | null; name: string; subpath?: string } = {
    namespace: null,
    name
  };
  if (ecosystem.id === 'maven') parts = split(name.indexOf(':'));
  else if (ecosystem.id === 'actions') {
    const [owner, repo, ...path] = name.split('/');
    parts = { namespace: owner, name: repo, subpath: path.join('/') };
  } else if (name.includes('/')) parts = split(name.lastIndexOf('/'));
  try {
    return buildPurl({ type: ecosystem.purl, version, ...parts });
  } catch {
    return null;
  }
}

export type Identified =
  | { kind: 'known'; ecosystem: Ecosystem; name: string; version?: string; via: string }
  | { kind: 'choose'; options: { ecosystem: Ecosystem; name: string }[]; why: string }
  | { kind: 'search'; name: string }
  | { kind: 'invalid'; message: string };

const by = (id: EcosystemId) => ecosystems.find((entry) => entry.id === id)!;

// registry pages people paste, mapped to the name they describe
const pages: { pattern: RegExp; id: EcosystemId; name: (match: RegExpMatchArray) => string }[] = [
  { pattern: /npmjs\.com\/package\/((?:@[^/]+\/)?[^/?#]+)/, id: 'npm', name: (m) => m[1] },
  { pattern: /pypi\.org\/project\/([^/?#]+)/, id: 'pip', name: (m) => m[1] },
  { pattern: /crates\.io\/crates\/([^/?#]+)/, id: 'rust', name: (m) => m[1] },
  {
    pattern: /mvnrepository\.com\/artifact\/([^/?#]+)\/([^/?#]+)/,
    id: 'maven',
    name: (m) => `${m[1]}:${m[2]}`
  },
  {
    pattern: /central\.sonatype\.com\/artifact\/([^/?#]+)\/([^/?#]+)/,
    id: 'maven',
    name: (m) => `${m[1]}:${m[2]}`
  },
  {
    pattern: /search\.maven\.org\/artifact\/([^/?#]+)\/([^/?#]+)/,
    id: 'maven',
    name: (m) => `${m[1]}:${m[2]}`
  },
  { pattern: /rubygems\.org\/gems\/([^/?#]+)/, id: 'rubygems', name: (m) => m[1] },
  { pattern: /nuget\.org\/packages\/([^/?#]+)/i, id: 'nuget', name: (m) => m[1] },
  { pattern: /packagist\.org\/packages\/([^/?#]+\/[^/?#]+)/, id: 'composer', name: (m) => m[1] },
  { pattern: /pkg\.go\.dev\/([^?#@]+)/, id: 'go', name: (m) => m[1].replace(/\/+$/, '') },
  { pattern: /pub\.dev\/packages\/([^/?#]+)/, id: 'pub', name: (m) => m[1] },
  { pattern: /hex\.pm\/packages\/([^/?#]+)/, id: 'erlang', name: (m) => m[1] },
  {
    pattern: /swiftpackageindex\.com\/([^/?#]+)\/([^/?#]+)/,
    id: 'swift',
    name: (m) => `github.com/${m[1]}/${m[2]}`
  }
];

function fromPurl(text: string): Identified {
  try {
    const purl = parsePurl(text);
    const found = ecosystems.find((entry) => entry.purl === purl.type);
    if (!found)
      return {
        kind: 'invalid',
        message: `That's a valid PURL, but we don't look up "${purl.type}" packages.`
      };
    const separator = found.id === 'maven' ? ':' : '/';
    const name = purl.namespace ? `${purl.namespace}${separator}${purl.name}` : purl.name;
    return {
      kind: 'known',
      ecosystem: found,
      name,
      version: purl.version ?? undefined,
      via: 'PURL'
    };
  } catch (error) {
    if (error instanceof PurlError) return { kind: 'invalid', message: error.message };
    throw error;
  }
}

function fromUrl(text: string): Identified {
  const url = text.replace(/^https?:\/\/(www\.)?/, '');
  for (const { pattern, id, name } of pages) {
    const match = url.match(pattern);
    if (match)
      return {
        kind: 'known',
        ecosystem: by(id),
        name: decodeURIComponent(name(match)),
        via: 'registry URL'
      };
  }
  const repo = url.match(/^github\.com\/([^/?#]+)\/([^/?#]+?)(?:\.git)?(?:[/?#]|$)/);
  if (repo) return repoChoices(`github.com/${repo[1]}/${repo[2]}`);
  return {
    kind: 'invalid',
    message:
      "That URL isn't a registry page we recognise. Paste the package name or its registry page instead."
  };
}

const repoChoices = (path: string): Identified => ({
  kind: 'choose',
  why: 'A GitHub repo could be a Go module, a Swift package or an Action.',
  options: [
    { ecosystem: by('go'), name: path },
    { ecosystem: by('swift'), name: path },
    { ecosystem: by('actions'), name: path.replace(/^github\.com\//, '') }
  ]
});

/** works out what someone pasted into the package box */
export function identify(input: string, forced?: string | null): Identified | null {
  const text = input.trim();
  if (!text) return null;
  if (/^pkg:/i.test(text)) return fromPurl(text);
  if (/^https?:\/\//i.test(text) || pages.some(({ pattern }) => pattern.test(text))) {
    return fromUrl(text);
  }
  const chosen = ecosystem(forced);
  if (chosen) return { kind: 'known', ecosystem: chosen, name: chosen.normalise(text), via: '' };
  if (/^[\w.-]+:[\w.-]+$/.test(text))
    return { kind: 'known', ecosystem: by('maven'), name: text, via: 'group:artifact form' };
  if (/^@[^/\s]+\/[^/\s]+$/.test(text))
    return { kind: 'known', ecosystem: by('npm'), name: text, via: '@scope' };
  if (/^github\.com\/[^/\s]+\/[^/\s]+$/i.test(text)) return repoChoices(text.replace(/\.git$/, ''));
  if (/^[a-z0-9-]+(\.[a-z0-9-]+)+\/\S+$/i.test(text)) {
    return {
      kind: 'known',
      ecosystem: by('go'),
      name: by('go').normalise(text),
      via: 'module path'
    };
  }
  if (/^[\w.-]+\/[\w.-]+$/.test(text)) {
    return {
      kind: 'choose',
      why: '"vendor/name" could be a Composer package or a GitHub Action.',
      options: [
        { ecosystem: by('composer'), name: text.toLowerCase() },
        { ecosystem: by('actions'), name: text }
      ]
    };
  }
  if (/\s/.test(text))
    return {
      kind: 'invalid',
      message: "Package names don't have spaces in them. Paste one name, PURL or registry URL."
    };
  return { kind: 'search', name: text };
}

/** ecosystems a bare name can be looked up in without more to go on */
export const searchable = ecosystems.filter((entry) =>
  ['npm', 'pip', 'rubygems', 'rust', 'nuget', 'pub', 'erlang'].includes(entry.id)
);
