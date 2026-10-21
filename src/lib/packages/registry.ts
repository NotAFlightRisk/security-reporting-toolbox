import type { Ecosystem } from '#lib/ecosystems.ts';
import { getJson, type Outcome } from '#lib/net/fetch.ts';
import { schemes } from '#lib/versions/schemes.ts';

export interface Release {
  version: string;
  published?: string;
  deprecated?: boolean;
  /** yanked, retired or retracted, in the registry's own word */
  pulled?: string;
}

export interface PackageInfo {
  name: string;
  latest?: string;
  /** newest first, versions the scheme can't read go last */
  releases: Release[];
  /** undefined when the source doesn't say, [] when it says there are none */
  licenses?: string[];
  repo?: string;
  homepage?: string;
  description?: string;
  source: { name: string; url: string };
}

export type Lookup = Outcome<PackageInfo> | { status: 'unsupported'; reason: string };

interface DepsDevPackage {
  packageKey: { name: string };
  versions: {
    versionKey: { version: string };
    publishedAt?: string;
    isDefault: boolean;
    isDeprecated: boolean;
  }[];
}

interface DepsDevVersion {
  licenses?: string[];
  links?: { label: string; url: string }[];
}

interface PubPackage {
  name: string;
  latest: {
    version: string;
    pubspec: { description?: string; repository?: string; homepage?: string };
  };
  versions: { version: string; published?: string; retracted?: boolean }[];
}

interface HexPackage {
  name: string;
  html_url: string;
  meta: { description?: string; licenses?: string[]; links?: Record<string, string> };
  latest_stable_version?: string;
  latest_version?: string;
  releases: { version: string; inserted_at: string }[];
  retirements?: Record<string, { reason?: string }>;
}

/** "git+https://github.com/x/y.git" and friends, as a link someone can click */
export function repoUrl(url: string | undefined) {
  if (!url) return undefined;
  const clean = url
    .trim()
    .replace(/^git\+/, '')
    .replace(/^git:\/\//, 'https://')
    .replace(/^git@([^:]+):/, 'https://$1/')
    .replace(/^([^?#]+)\.git$/, '$1');
  return /^https?:\/\//.test(clean) ? clean : undefined;
}

export function sortReleases(ecosystem: Ecosystem, releases: Release[]) {
  const scheme = schemes[ecosystem.scheme];
  const readable = releases.filter((release) => scheme.clean(release.version));
  const odd = releases.filter((release) => !scheme.clean(release.version));
  return [...readable.sort((a, b) => scheme.compare(b.version, a.version)), ...odd];
}

const depsDevBase = 'https://api.deps.dev/v3/systems';
const depsDevPackageUrl = (ecosystem: Ecosystem, name: string) =>
  `${depsDevBase}/${ecosystem.depsDev}/packages/${encodeURIComponent(name)}`;

export function fromDepsDev(ecosystem: Ecosystem, data: DepsDevPackage): PackageInfo {
  const releases = data.versions.map((entry) => ({
    version: entry.versionKey.version,
    published: entry.publishedAt,
    deprecated: entry.isDeprecated
  }));
  const name = data.packageKey.name;
  return {
    name,
    latest: data.versions.find((entry) => entry.isDefault)?.versionKey.version,
    releases: sortReleases(ecosystem, releases),
    source: {
      name: 'deps.dev',
      url: `https://deps.dev/${ecosystem.depsDev!.toLowerCase()}/${encodeURIComponent(name)}`
    }
  };
}

export function withDepsDevVersion(info: PackageInfo, data: DepsDevVersion): PackageInfo {
  const link = (label: string) => data.links?.find((entry) => entry.label === label)?.url;
  return {
    ...info,
    licenses: data.licenses ?? [],
    repo: repoUrl(link('SOURCE_REPO')),
    homepage: link('HOMEPAGE')
  };
}

export function fromPub(ecosystem: Ecosystem, data: PubPackage): PackageInfo {
  const { pubspec } = data.latest;
  return {
    name: data.name,
    latest: data.latest.version,
    releases: sortReleases(
      ecosystem,
      data.versions.map((entry) => ({
        version: entry.version,
        published: entry.published,
        pulled: entry.retracted ? 'retracted' : undefined
      }))
    ),
    repo: repoUrl(pubspec.repository),
    homepage: pubspec.homepage,
    description: pubspec.description,
    source: { name: 'pub.dev', url: `https://pub.dev/packages/${data.name}` }
  };
}

export function fromHex(ecosystem: Ecosystem, data: HexPackage): PackageInfo {
  const links = Object.entries(data.meta.links ?? {});
  const repo = links.find(
    ([label, url]) => /github|gitlab|source/i.test(label) || /github\.com|gitlab\.com/.test(url)
  );
  return {
    name: data.name,
    latest: data.latest_stable_version ?? data.latest_version,
    releases: sortReleases(
      ecosystem,
      data.releases.map((entry) => ({
        version: entry.version,
        published: entry.inserted_at,
        pulled: data.retirements?.[entry.version] ? 'retired' : undefined
      }))
    ),
    licenses: data.meta.licenses ?? [],
    repo: repoUrl(repo?.[1]),
    description: data.meta.description,
    source: { name: 'hex.pm', url: data.html_url }
  };
}

const unsupported: Partial<Record<Ecosystem['id'], string>> = {
  composer:
    "Packagist doesn't let browsers ask it directly, so we can't check Composer packages from here.",
  swift: "There's no public Swift package registry API to ask, so check the repo itself.",
  actions: "GitHub Actions don't live in a registry, they're just repos and tags."
};

async function map<T>(
  outcome: Promise<Outcome<T>>,
  convert: (data: T) => PackageInfo
): Promise<Lookup> {
  const result = await outcome;
  return result.status === 'ok' ? { status: 'ok', data: convert(result.data) } : result;
}

/** the package's releases from whichever source covers its ecosystem */
export function lookup(ecosystem: Ecosystem, name: string): Promise<Lookup> {
  if (ecosystem.depsDev) {
    return map(getJson<DepsDevPackage>(depsDevPackageUrl(ecosystem, name)), (data) =>
      fromDepsDev(ecosystem, data)
    );
  }
  if (ecosystem.registry === 'pub') {
    return map(
      getJson<PubPackage>(`https://pub.dev/api/packages/${encodeURIComponent(name)}`),
      (data) => fromPub(ecosystem, data)
    );
  }
  if (ecosystem.registry === 'hex') {
    return map(
      getJson<HexPackage>(`https://hex.pm/api/packages/${encodeURIComponent(name)}`),
      (data) => fromHex(ecosystem, data)
    );
  }
  return Promise.resolve({
    status: 'unsupported',
    reason: unsupported[ecosystem.id] ?? "We don't have a source for this ecosystem."
  });
}

export interface Enriched {
  info: PackageInfo;
  /** why the licence and links are unknown, as opposed to empty */
  gap?: string;
}

/** licence and links for the latest version, which deps.dev keeps per version */
export async function details(ecosystem: Ecosystem, info: PackageInfo): Promise<Enriched> {
  if (!ecosystem.depsDev || !info.latest) return { info };
  const url = `${depsDevPackageUrl(ecosystem, info.name)}/versions/${encodeURIComponent(info.latest)}`;
  const result = await getJson<DepsDevVersion>(url);
  if (result.status === 'ok') return { info: withDepsDevVersion(info, result.data) };
  const why = result.status === 'missing' ? `has no record of ${info.latest}` : result.message;
  return { info, gap: `deps.dev ${why}, so the licence and links are unknown rather than empty.` };
}
