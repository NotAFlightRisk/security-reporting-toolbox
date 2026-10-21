import type { SchemeId } from '#lib/versions/schemes.ts';

/** GitHub advisory ecosystem keys, which every tool here uses as the id */
export type EcosystemId =
  | 'npm'
  | 'pip'
  | 'maven'
  | 'rubygems'
  | 'go'
  | 'rust'
  | 'nuget'
  | 'composer'
  | 'pub'
  | 'erlang'
  | 'swift'
  | 'actions';

export type DepsDevSystem = 'NPM' | 'PYPI' | 'MAVEN' | 'RUBYGEMS' | 'GO' | 'CARGO' | 'NUGET';

export interface NameProblem {
  level: 'error' | 'warning';
  message: string;
}

export interface Ecosystem {
  id: EcosystemId;
  name: string;
  osv: string;
  purl: string;
  depsDev?: DepsDevSystem;
  /** where version and release data comes from when deps.dev doesn't cover it */
  registry?: 'pub' | 'hex';
  scheme: SchemeId;
  aliases: string[];
  example: string;
  /** turns a name into the form the registry treats as canonical */
  normalise: (name: string) => string;
  check: (name: string) => NameProblem | null;
  /** the human page for a package */
  page: (name: string) => string;
}

const same = (name: string) => name.trim();
const error = (message: string): NameProblem => ({ level: 'error', message });
const warning = (message: string): NameProblem => ({ level: 'warning', message });
const rule = (pattern: RegExp, message: string) => (name: string) =>
  pattern.test(name) ? null : error(message);

function checkNpm(name: string) {
  if (name.length > 214) return error('npm names max out at 214 characters.');
  const match = name.match(/^(?:@([^/]+)\/)?([^/]+)$/);
  if (!match) return error('npm names are "name" or "@scope/name", with one slash at most.');
  const parts = match.slice(1).filter(Boolean);
  if (parts.some((part) => /^[._]/.test(part))) return error("npm names can't start with . or _.");
  if (parts.some((part) => !/^[a-zA-Z0-9._~-]+$/.test(part))) {
    return error('npm names only use letters, numbers and - . _ ~ (no spaces).');
  }
  if (/[A-Z]/.test(name)) {
    return warning(
      'New npm packages must be lowercase, so this is either an old package or a typo.'
    );
  }
  return null;
}

export const ecosystems: Ecosystem[] = [
  {
    id: 'npm',
    name: 'npm',
    osv: 'npm',
    purl: 'npm',
    depsDev: 'NPM',
    scheme: 'semver',
    aliases: ['node', 'nodejs', 'javascript', 'js', 'yarn', 'pnpm'],
    example: 'express or @sveltejs/kit',
    normalise: same,
    check: checkNpm,
    page: (name) => `https://www.npmjs.com/package/${name}`
  },
  {
    id: 'pip',
    name: 'PyPI',
    osv: 'PyPI',
    purl: 'pypi',
    depsDev: 'PYPI',
    scheme: 'pep440',
    aliases: ['pypi', 'python', 'py'],
    example: 'requests or django-allauth',
    // PEP 503: case and runs of - _ . don't matter
    normalise: (name) =>
      name
        .trim()
        .toLowerCase()
        .replace(/[-_.]+/g, '-'),
    check: rule(
      /^([A-Z0-9]|[A-Z0-9][A-Z0-9._-]*[A-Z0-9])$/i,
      'PyPI names are letters, numbers, - _ and ., starting and ending with a letter or number.'
    ),
    page: (name) => `https://pypi.org/project/${name}/`
  },
  {
    id: 'maven',
    name: 'Maven',
    osv: 'Maven',
    purl: 'maven',
    depsDev: 'MAVEN',
    scheme: 'maven',
    aliases: ['java', 'gradle', 'kotlin', 'mvn'],
    example: 'org.apache.logging.log4j:log4j-core',
    normalise: (name) => name.trim().replace(/^([^:/]+)\/([^:/]+)$/, '$1:$2'),
    check: rule(
      /^[\w.-]+:[\w.-]+$/,
      'Maven packages are "groupId:artifactId", like org.apache.logging.log4j:log4j-core.'
    ),
    page: (name) => `https://central.sonatype.com/artifact/${name.replace(':', '/')}`
  },
  {
    id: 'rubygems',
    name: 'RubyGems',
    osv: 'RubyGems',
    purl: 'gem',
    depsDev: 'RUBYGEMS',
    scheme: 'rubygems',
    aliases: ['ruby', 'gem', 'gems', 'bundler'],
    example: 'rails',
    normalise: same,
    check: rule(
      /^(?=.*[a-zA-Z])[\w.-]+$/,
      'Gem names are letters, numbers, - _ and ., with at least one letter.'
    ),
    page: (name) => `https://rubygems.org/gems/${name}`
  },
  {
    id: 'go',
    name: 'Go',
    osv: 'Go',
    purl: 'golang',
    depsDev: 'GO',
    scheme: 'go',
    aliases: ['golang', 'gomod'],
    example: 'github.com/gin-gonic/gin',
    normalise: (name) =>
      name
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/\/+$/, ''),
    check: rule(
      /^[a-z0-9.-]+\.[a-z]{2,}(\/[\w.~-]+)+$/,
      'Go modules are import paths starting with a domain, like github.com/gin-gonic/gin.'
    ),
    page: (name) => `https://pkg.go.dev/${name}`
  },
  {
    id: 'rust',
    name: 'crates.io',
    osv: 'crates.io',
    purl: 'cargo',
    depsDev: 'CARGO',
    scheme: 'semver',
    aliases: ['cargo', 'crates', 'crates.io', 'crate'],
    example: 'serde',
    normalise: same,
    check: rule(
      /^[a-zA-Z][\w-]{0,63}$/,
      'Crate names start with a letter and use letters, numbers, - and _, up to 64 characters.'
    ),
    page: (name) => `https://crates.io/crates/${name}`
  },
  {
    id: 'nuget',
    name: 'NuGet',
    osv: 'NuGet',
    purl: 'nuget',
    depsDev: 'NUGET',
    scheme: 'nuget',
    aliases: ['dotnet', '.net', 'csharp', 'c#'],
    example: 'Newtonsoft.Json',
    normalise: same,
    check: rule(
      /^[\w.-]{1,100}$/,
      'NuGet IDs are letters, numbers, - _ and ., up to 100 characters.'
    ),
    page: (name) => `https://www.nuget.org/packages/${name}`
  },
  {
    id: 'composer',
    name: 'Composer',
    osv: 'Packagist',
    purl: 'composer',
    scheme: 'generic',
    aliases: ['packagist', 'php'],
    example: 'guzzlehttp/guzzle',
    normalise: (name) => name.trim().toLowerCase(),
    check: rule(
      /^[a-z0-9]([_.-]?[a-z0-9]+)*\/[a-z0-9](([_.]|-{1,2})?[a-z0-9]+)*$/i,
      'Composer packages are "vendor/package", like guzzlehttp/guzzle.'
    ),
    page: (name) => `https://packagist.org/packages/${name}`
  },
  {
    id: 'pub',
    name: 'Pub',
    osv: 'Pub',
    purl: 'pub',
    registry: 'pub',
    scheme: 'semver',
    aliases: ['dart', 'flutter', 'pub.dev'],
    example: 'http',
    normalise: same,
    check: rule(/^[a-z_][a-z0-9_]*$/, 'Pub names are lowercase letters, numbers and _.'),
    page: (name) => `https://pub.dev/packages/${name}`
  },
  {
    id: 'erlang',
    name: 'Hex',
    osv: 'Hex',
    purl: 'hex',
    registry: 'hex',
    scheme: 'semver',
    aliases: ['hex', 'elixir', 'erlang', 'hex.pm'],
    example: 'phoenix',
    normalise: same,
    check: rule(
      /^[a-z][a-z0-9_]*$/,
      'Hex names are lowercase letters, numbers and _, starting with a letter.'
    ),
    page: (name) => `https://hex.pm/packages/${name}`
  },
  {
    id: 'swift',
    name: 'Swift',
    osv: 'SwiftURL',
    purl: 'swift',
    scheme: 'semver',
    aliases: ['swiftpm', 'spm', 'swifturl'],
    example: 'github.com/Alamofire/Alamofire',
    normalise: (name) =>
      name
        .trim()
        .replace(/^https?:\/\//, '')
        .replace(/(\.git)?\/*$/, ''),
    check: rule(
      /^[a-z0-9.-]+\.[a-z]{2,}(\/[\w.-]+){2,}$/i,
      'Swift packages are named by their repo URL without https://, like github.com/Alamofire/Alamofire.'
    ),
    page: (name) => `https://${name}`
  },
  {
    id: 'actions',
    name: 'GitHub Actions',
    osv: 'GitHub Actions',
    purl: 'github',
    scheme: 'generic',
    aliases: ['github actions', 'github-actions', 'action', 'gha', 'workflow'],
    example: 'actions/checkout',
    normalise: (name) => name.trim().replace(/^https?:\/\/github\.com\//, ''),
    check: rule(
      /^[\w.-]+\/[\w.-]+(\/[\w./-]+)?$/,
      'Actions are "owner/repo" (or "owner/repo/path"), like actions/checkout.'
    ),
    page: (name) => `https://github.com/${name.split('/').slice(0, 2).join('/')}`
  }
];

/** finds an ecosystem by key, name or a common alias, case-insensitive */
export function ecosystem(key: string | null | undefined) {
  const wanted = key?.trim().toLowerCase();
  if (!wanted) return undefined;
  return ecosystems.find(({ id, name, osv, purl, aliases }) =>
    [id, name, osv, purl, ...aliases].some((each) => each.toLowerCase() === wanted)
  );
}
