import { describe, expect, it } from 'vitest';
import { ecosystem } from '#lib/ecosystems.ts';
import { identify, purlFor } from '#lib/packages/identify.ts';

const known = (input: string, forced?: string) => {
  const result = identify(input, forced);
  return result?.kind === 'known' ? [result.ecosystem.id, result.name, result.version] : result;
};

describe('working out what was pasted', () => {
  it.each([
    ['https://www.npmjs.com/package/@sveltejs/kit', ['npm', '@sveltejs/kit', undefined]],
    ['npmjs.com/package/express?activeTab=versions', ['npm', 'express', undefined]],
    ['https://pypi.org/project/Django/', ['pip', 'Django', undefined]],
    ['https://crates.io/crates/serde', ['rust', 'serde', undefined]],
    [
      'https://mvnrepository.com/artifact/org.apache.logging.log4j/log4j-core/2.17.1',
      ['maven', 'org.apache.logging.log4j:log4j-core', undefined]
    ],
    [
      'https://central.sonatype.com/artifact/com.google.guava/guava',
      ['maven', 'com.google.guava:guava', undefined]
    ],
    ['https://rubygems.org/gems/rails', ['rubygems', 'rails', undefined]],
    [
      'https://www.nuget.org/packages/Newtonsoft.Json/13.0.3',
      ['nuget', 'Newtonsoft.Json', undefined]
    ],
    [
      'https://packagist.org/packages/guzzlehttp/guzzle',
      ['composer', 'guzzlehttp/guzzle', undefined]
    ],
    [
      'https://pkg.go.dev/github.com/gin-gonic/gin@v1.9.1',
      ['go', 'github.com/gin-gonic/gin', undefined]
    ],
    ['https://pub.dev/packages/http', ['pub', 'http', undefined]],
    ['https://hex.pm/packages/phoenix', ['erlang', 'phoenix', undefined]],
    ['pkg:npm/%40angular/animation@12.3.1', ['npm', '@angular/animation', '12.3.1']],
    ['pkg:maven/org.apache.commons/io@1.3.4', ['maven', 'org.apache.commons:io', '1.3.4']],
    ['pkg:pypi/Django_package', ['pip', 'django-package', undefined]],
    ['pkg:golang/github.com/gorilla/context', ['go', 'github.com/gorilla/context', undefined]],
    ['org.springframework:spring-core', ['maven', 'org.springframework:spring-core', undefined]],
    ['@babel/core', ['npm', '@babel/core', undefined]],
    ['golang.org/x/net', ['go', 'golang.org/x/net', undefined]],
    ['Requests', ['pip', 'requests', undefined], 'pypi'],
    ['requests', ['rust', 'requests', undefined], 'cargo']
  ])('%s', (input, expected, forced?: string) => {
    expect(known(input, forced)).toEqual(expected);
  });

  it('asks which ecosystem a GitHub repo means', () => {
    const result = identify('https://github.com/actions/checkout');
    expect(
      result?.kind === 'choose' &&
        result.options.map((option) => [option.ecosystem.id, option.name])
    ).toEqual([
      ['go', 'github.com/actions/checkout'],
      ['swift', 'github.com/actions/checkout'],
      ['actions', 'actions/checkout']
    ]);
  });

  it('asks about vendor/name, which could be Composer or an Action', () => {
    expect(identify('laravel/framework')?.kind).toBe('choose');
  });

  it('searches every ecosystem for a bare name', () => {
    expect(identify('lodash')).toEqual({ kind: 'search', name: 'lodash' });
  });

  it.each([
    ['https://example.com/some/thing', 'registry page we recognise'],
    ['pkg:conda/numpy', "don't look up"],
    ['pkg:npm', 'type and a name'],
    ['left pad', "don't have spaces"]
  ])('explains what is wrong with %s', (input, hint) => {
    const result = identify(input);
    expect(result?.kind === 'invalid' && result.message).toContain(hint);
  });

  it('ignores an empty box', () => {
    expect(identify('   ')).toBeNull();
  });
});

describe('PURLs for a package', () => {
  it.each([
    ['npm', '@angular/animation', '12.3.1', 'pkg:npm/%40angular/animation@12.3.1'],
    ['pip', 'Django_Package', undefined, 'pkg:pypi/django-package'],
    [
      'maven',
      'org.apache.logging.log4j:log4j-core',
      '2.17.1',
      'pkg:maven/org.apache.logging.log4j/log4j-core@2.17.1'
    ],
    ['go', 'github.com/gorilla/context', undefined, 'pkg:golang/github.com/gorilla/context'],
    ['composer', 'laravel/laravel', '5.5.0', 'pkg:composer/laravel/laravel@5.5.0'],
    ['actions', 'github/codeql-action/init', 'v3', 'pkg:github/github/codeql-action@v3#init'],
    ['rubygems', 'rails', undefined, 'pkg:gem/rails'],
    ['rust', 'serde', '1.0.0', 'pkg:cargo/serde@1.0.0']
  ])('%s %s', (id, name, version, expected) => {
    expect(purlFor(ecosystem(id)!, name, version)).toBe(expected);
  });

  it('gives up rather than inventing one when the name cannot make a PURL', () => {
    expect(purlFor(ecosystem('swift')!, 'Alamofire')).toBeNull();
  });
});
