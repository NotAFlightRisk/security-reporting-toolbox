import { describe, expect, it } from 'vitest';
import { ecosystem } from '#lib/ecosystems.ts';

describe('finding an ecosystem from what other tools and people call it', () => {
  it.each([
    ['npm', 'npm'],
    ['pip', 'pip'],
    ['PyPI', 'pip'],
    ['cargo', 'rust'],
    ['crates.io', 'rust'],
    ['golang', 'go'],
    ['Packagist', 'composer'],
    ['gem', 'rubygems'],
    ['hex', 'erlang'],
    ['GitHub Actions', 'actions']
  ])('%s is %s', (key, id) => {
    expect(ecosystem(key)?.id).toBe(id);
  });

  it.each([[''], [null], ['cobol']])('%s finds nothing', (key) => {
    expect(ecosystem(key)).toBeUndefined();
  });
});

describe('package name rules', () => {
  it.each([
    ['npm', 'express', null],
    ['npm', '@sveltejs/kit', null],
    ['npm', '_private', 'error'],
    ['npm', 'left pad', 'error'],
    ['npm', 'JSONStream', 'warning'],
    ['pip', 'django-allauth', null],
    ['pip', '-bad-', 'error'],
    ['maven', 'org.apache.logging.log4j:log4j-core', null],
    ['maven', 'log4j-core', 'error'],
    ['go', 'github.com/gin-gonic/gin', null],
    ['go', 'gin', 'error'],
    ['rust', 'serde_json', null],
    ['rust', '1password', 'error'],
    ['composer', 'guzzlehttp/guzzle', null],
    ['composer', 'guzzle', 'error'],
    ['pub', 'http', null],
    ['pub', 'Http', 'error'],
    ['swift', 'github.com/Alamofire/Alamofire', null],
    ['actions', 'actions/checkout', null]
  ])('%s: %s -> %s', (id, name, level) => {
    expect(ecosystem(id)!.check(name)?.level ?? null).toBe(level);
  });

  it.each([
    ['pip', 'Django_Allauth', 'django-allauth'],
    ['maven', 'org.slf4j/slf4j-api', 'org.slf4j:slf4j-api'],
    ['go', 'https://github.com/gin-gonic/gin/', 'github.com/gin-gonic/gin'],
    ['swift', 'https://github.com/Alamofire/Alamofire.git', 'github.com/Alamofire/Alamofire'],
    ['composer', 'GuzzleHttp/Guzzle', 'guzzlehttp/guzzle']
  ])('%s normalises %s to %s', (id, name, expected) => {
    expect(ecosystem(id)!.normalise(name)).toBe(expected);
  });
});
