import { describe, expect, it } from 'vitest';
import { schemes, type SchemeId } from '#lib/versions/schemes.ts';

const sign = (scheme: SchemeId, a: string, b: string) => Math.sign(schemes[scheme].compare(a, b));

describe('Maven ordering, from the Maven POM reference version order examples', () => {
  it.each([
    ['1', '1.1', -1],
    ['1-snapshot', '1', -1],
    ['1', '1-sp', -1],
    ['1-foo2', '1-foo10', -1],
    ['1.foo', '1-foo', 0],
    ['1-foo', '1-1', -1],
    ['1-1', '1.1', -1],
    ['1.ga', '1-ga', 0],
    ['1-ga', '1-0', 0],
    ['1-0', '1.0', 0],
    ['1.0', '1', 0],
    ['1-sp', '1-ga', 1],
    ['1-sp.1', '1-ga.1', 1],
    ['1-a1', '1-alpha-1', 0],
    ['2.0.0-RC1', '2.0.0', -1],
    ['2.0.0-beta-2', '2.0.0-rc1', -1],
    ['6.0.0-M1', '6.0.0-RC1', -1],
    ['2.17.1', '2.15.0', 1],
    ['1.0.Final', '1.0', 0],
    ['32.0.0-android', '32.0.0-jre', -1]
  ])('%s vs %s is %i', (a, b, expected) => {
    expect(sign('maven', a, b)).toBe(expected);
  });
});

describe('RubyGems ordering, from Gem::Version spaceship tests', () => {
  it.each([
    ['1.0', '1.0.0', 0],
    ['1.0', '1.0.a', 1],
    ['1.8.2', '0.0.0', 1],
    ['1.8.2', '1.8.2.a', 1],
    ['1.8.2.b', '1.8.2.a', 1],
    ['1.8.2.a', '1.8.2', -1],
    ['1.8.2.a10', '1.8.2.a9', 1],
    ['0.beta.1', '0.0.beta.1', 0],
    ['0.0.beta', '0.0.beta.1', -1],
    ['0.0.beta', '0.beta.1', -1],
    ['5.a', '5.0.0.rc2', -1],
    ['5.x', '5.0.0.rc2', 1],
    ['7.1.0-1', '7.1.0', -1]
  ])('%s vs %s is %i', (a, b, expected) => {
    expect(sign('rubygems', a, b)).toBe(expected);
  });
});

describe('PEP 440 ordering, from the spec summary of permitted suffixes', () => {
  const ordered = [
    '1.0.dev456',
    '1.0a1',
    '1.0a2.dev456',
    '1.0a12',
    '1.0b1.dev456',
    '1.0b2',
    '1.0b2.post345',
    '1.0rc1',
    '1.0',
    '1.0.post456.dev34',
    '1.0.post456',
    '1.1.dev1'
  ];
  it.each(ordered.slice(1).map((version, index) => [ordered[index], version]))(
    '%s comes before %s',
    (a, b) => {
      expect(sign('pep440', a, b)).toBe(-1);
    }
  );

  it('treats 1.0 and 1.0.0 as the same release', () => {
    expect(sign('pep440', '1.0', '1.0.0')).toBe(0);
  });
});

describe('SemVer ordering, from the SemVer 2.0 spec precedence example', () => {
  const ordered = [
    '1.0.0-alpha',
    '1.0.0-alpha.1',
    '1.0.0-alpha.beta',
    '1.0.0-beta',
    '1.0.0-beta.2',
    '1.0.0-beta.11',
    '1.0.0-rc.1',
    '1.0.0'
  ];
  it.each(ordered.slice(1).map((version, index) => [ordered[index], version]))(
    '%s comes before %s',
    (a, b) => {
      expect(sign('semver', a, b)).toBe(-1);
    }
  );

  it('sorts Go pseudo-versions before the release they lead up to', () => {
    expect(sign('go', 'v0.0.0-20140617234234-15216a0883d1', 'v0.0.1')).toBe(-1);
    expect(sign('go', 'v1.9.1', '1.9.1')).toBe(0);
  });
});

describe('NuGet ordering', () => {
  it.each([
    ['1.0.0', '1.0.0.0', 0],
    ['1.0.0.1', '1.0.0', 1],
    ['1.0.0-beta', '1.0.0', -1],
    ['1.0.0-Beta', '1.0.0-beta', 0],
    ['1.0.0-beta.2', '1.0.0-beta.10', -1],
    ['1.0.0-1', '1.0.0-alpha', -1],
    ['13.0.3', '13.0.1', 1]
  ])('%s vs %s is %i', (a, b, expected) => {
    expect(sign('nuget', a, b)).toBe(expected);
  });
});

describe('version syntax per scheme', () => {
  it.each([
    ['semver', '1.2.3', '1.2.3'],
    ['semver', 'v1.2.3', '1.2.3'],
    ['semver', '1.2', null],
    ['semver', '1.2.3.4', null],
    ['pep440', '1.0.post1', '1.0.post1'],
    ['pep440', '1.0-beta', '1.0-beta'],
    ['pep440', 'banana', null],
    ['nuget', '4.0.0.1', '4.0.0.1'],
    ['nuget', '1.2.3.4.5', null],
    ['rubygems', '7.2.0.beta1', '7.2.0.beta1'],
    ['rubygems', '1.0 beta', null],
    ['maven', '1.0 Final', null],
    ['generic', 'v4', '4'],
    ['generic', 'latest', null]
  ] as [SchemeId, string, string | null][])('%s reads "%s" as %s', (scheme, input, expected) => {
    expect(schemes[scheme].clean(input)).toBe(expected);
  });
});

describe('numbers past 2^53 still order exactly', () => {
  it.each([
    ['maven', '1.9007199254740992', '1.9007199254740993'],
    ['rubygems', '1.9007199254740992', '1.9007199254740993'],
    ['nuget', '1.0.0-9007199254740992', '1.0.0-9007199254740993'],
    ['semver', '1.0.0-9007199254740992', '1.0.0-9007199254740993'],
    ['generic', '1.9007199254740992', '1.9007199254740993']
  ] as [SchemeId, string, string][])('%s: %s < %s', (scheme, a, b) => {
    expect(sign(scheme, a, b)).toBe(-1);
    expect(sign(scheme, b, a)).toBe(1);
  });
});
