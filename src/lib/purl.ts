// Package URLs, per https://github.com/package-url/purl-spec

export interface Purl {
  type: string;
  namespace: string | null;
  name: string;
  version: string | null;
  qualifiers: Record<string, string> | null;
  subpath: string | null;
}

export class PurlError extends Error {}

// the spec keeps ':' as is and encodes everything outside the unreserved set
const encode = (text: string) =>
  encodeURIComponent(text)
    .replaceAll('%3A', ':')
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

function decode(text: string) {
  try {
    return decodeURIComponent(text);
  } catch {
    throw new PurlError(`"${text}" has a broken %-escape in it.`);
  }
}

const rawSegments = (text: string) =>
  text.split('/').filter((part) => part && part !== '.' && part !== '..');
const segments = (text: string) => rawSegments(text).map(decode);

// per-type rules the spec spells out for the types we care about
const lowercased = {
  namespace: ['bitbucket', 'composer', 'github', 'pypi'],
  name: ['bitbucket', 'composer', 'github', 'pypi']
};

function tidy(purl: Purl): Purl {
  const { type } = purl;
  let { namespace, name } = purl;
  if (namespace && lowercased.namespace.includes(type)) namespace = namespace.toLowerCase();
  if (lowercased.name.includes(type)) name = name.toLowerCase();
  if (type === 'pypi') name = name.replaceAll('_', '-');
  if (!name) throw new PurlError('A PURL needs a name.');
  if (type === 'swift' && !namespace) {
    throw new PurlError(
      'Swift PURLs need the repo host and owner as a namespace, like github.com/Alamofire.'
    );
  }
  return { ...purl, namespace, name };
}

function checkType(type: string | null | undefined) {
  if (!type) throw new PurlError('A PURL needs a type, like pkg:npm/...');
  if (!/^[a-z.+-][a-z0-9.+-]*$/i.test(type)) {
    throw new PurlError(
      `"${type}" isn't a valid PURL type (letters, numbers and . + - only, not starting with a number).`
    );
  }
  return type.toLowerCase();
}

function checkQualifiers(qualifiers: Record<string, string> | null) {
  const entries = Object.entries(qualifiers ?? {}).filter(([, value]) => value !== '');
  for (const [key] of entries) {
    if (!/^[a-z.\-_][a-z0-9.\-_]*$/i.test(key)) {
      throw new PurlError(`"${key}" isn't a valid qualifier key.`);
    }
  }
  return entries.length
    ? Object.fromEntries(entries.map(([key, value]) => [key.toLowerCase(), value]))
    : null;
}

export function parsePurl(input: string): Purl {
  let rest = input.trim();
  let subpath: string | null = null;
  let qualifiers: Record<string, string> | null = null;

  const hash = rest.indexOf('#');
  if (hash >= 0) {
    subpath = segments(rest.slice(hash + 1)).join('/') || null;
    rest = rest.slice(0, hash);
  }
  const question = rest.indexOf('?');
  if (question >= 0) {
    const pairs = rest
      .slice(question + 1)
      .split('&')
      .filter(Boolean)
      .map((pair) => {
        const equals = pair.indexOf('=');
        if (equals < 1) throw new PurlError(`Qualifier "${pair}" needs to be key=value.`);
        return [pair.slice(0, equals), decode(pair.slice(equals + 1))];
      });
    qualifiers = checkQualifiers(Object.fromEntries(pairs));
    rest = rest.slice(0, question);
  }

  const colon = rest.indexOf(':');
  if (colon < 0 || rest.slice(0, colon).toLowerCase() !== 'pkg') {
    throw new PurlError('A PURL starts with "pkg:", like pkg:npm/express@4.18.2.');
  }
  rest = rest.slice(colon + 1).replace(/^\/+|\/+$/g, '');

  const slash = rest.indexOf('/');
  if (slash < 0) throw new PurlError('A PURL needs a type and a name, like pkg:npm/express.');
  const type = checkType(rest.slice(0, slash));
  rest = rest.slice(slash + 1);

  let version: string | null = null;
  const at = rest.lastIndexOf('@');
  if (at >= 0 && rest.lastIndexOf('/') < at) {
    version = decode(rest.slice(at + 1)) || null;
    rest = rest.slice(0, at);
  }

  const parts = rest.split('/');
  const name = decode(parts.pop() ?? '');
  const namespace = segments(parts.join('/')).join('/') || null;
  return tidy({ type, namespace, name, version, qualifiers, subpath });
}

export function buildPurl(parts: Partial<Purl>): string {
  const purl = tidy({
    type: checkType(parts.type),
    namespace: parts.namespace ?? null,
    name: parts.name ?? '',
    version: parts.version ?? null,
    qualifiers: checkQualifiers(parts.qualifiers ?? null),
    subpath: parts.subpath ?? null
  });
  const namespace = purl.namespace ? `${rawSegments(purl.namespace).map(encode).join('/')}/` : '';
  const version = purl.version ? `@${encode(purl.version)}` : '';
  const qualifiers = purl.qualifiers
    ? `?${Object.keys(purl.qualifiers)
        .sort()
        .map((key) => `${key}=${encode(purl.qualifiers![key])}`)
        .join('&')}`
    : '';
  const subpath = purl.subpath ? `#${rawSegments(purl.subpath).map(encode).join('/')}` : '';
  return `pkg:${purl.type}/${namespace}${encode(purl.name)}${version}${qualifiers}${subpath}`;
}

export const canonicalPurl = (input: string) => buildPurl(parsePurl(input));
