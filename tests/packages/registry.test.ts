import { afterEach, describe, expect, it, vi } from 'vitest';
import { ecosystem } from '#lib/ecosystems.ts';
import {
  details,
  fromDepsDev,
  fromHex,
  fromPub,
  repoUrl,
  withDepsDevVersion
} from '#lib/packages/registry.ts';
import requests from '../fixtures/packages/depsdev-package-pypi-requests.json';
import log4j from '../fixtures/packages/depsdev-version-maven-log4j.json';
import phoenix from '../fixtures/packages/hexpm-phoenix.json';
import http from '../fixtures/packages/pubdev-http.json';

describe('normalising registry payloads', () => {
  it('reads deps.dev releases newest first, with the default as latest', () => {
    const info = fromDepsDev(ecosystem('pip')!, requests);
    expect(info.latest).toBe('2.34.2');
    expect(info.releases.map((release) => release.version)).toEqual([
      '2.34.2',
      '2.32.3',
      '2.32.0',
      '2.31.0',
      '2.0.0',
      '0.10.0'
    ]);
    expect(info.releases[0].published).toBe('2026-05-14T19:25:26Z');
  });

  it('takes licence and repo from the deps.dev version record', () => {
    const info = withDepsDevVersion(fromDepsDev(ecosystem('pip')!, requests), log4j);
    expect(info.licenses).toEqual(['Apache-2.0']);
    expect(info.homepage).toBe('https://logging.apache.org/log4j/2.x/');
    expect(info.repo).toBe('https://gitbox.apache.org/repos/asf?p=logging-log4j2.git');
  });

  it('reads pub.dev, sorting pre-releases under the release', () => {
    const info = fromPub(ecosystem('pub')!, http);
    expect(info.latest).toBe('1.6.0');
    expect(info.releases.map((release) => release.version)).toEqual([
      '1.6.0',
      '1.5.0',
      '1.5.0-beta.2',
      '1.5.0-beta'
    ]);
    expect(info.repo).toBe('https://github.com/dart-lang/http/tree/master/pkgs/http');
  });

  it('reads hex.pm, picking the GitHub link as the repo', () => {
    const info = fromHex(ecosystem('erlang')!, phoenix);
    expect(info.latest).toBe('1.8.16');
    expect(info.licenses).toEqual(['MIT']);
    expect(info.repo).toBe('https://github.com/phoenixframework/phoenix');
  });
});

describe('repo links', () => {
  it.each([
    ['git+https://github.com/sveltejs/kit.git', 'https://github.com/sveltejs/kit'],
    ['git://github.com/expressjs/express.git', 'https://github.com/expressjs/express'],
    ['git@github.com:rails/rails.git', 'https://github.com/rails/rails'],
    ['not a url', undefined],
    [undefined, undefined]
  ])('%s', (input, expected) => {
    expect(repoUrl(input)).toBe(expected);
  });
});

describe('the latest-version details from deps.dev', () => {
  const npm = ecosystem('npm')!;
  const base = (name: string) => ({
    ...fromDepsDev(npm, { packageKey: { name }, versions: [] }),
    latest: '1.0.0'
  });
  const answer = (status: number, body: unknown = {}) =>
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify(body), { status }))
    );

  afterEach(() => vi.unstubAllGlobals());

  it.each([
    [429, 'rate limiting'],
    [500, 'answered 500']
  ])('says the licence and links are unknown when it answers %i', async (status, hint) => {
    answer(status);
    const { info, gap } = await details(npm, base(`failing-${status}`));
    expect(gap).toContain(hint);
    expect(gap).toContain('unknown');
    expect(info.licenses).toBeUndefined();
  });

  it('keeps "declares none" apart from "unknown"', async () => {
    answer(200, { licenses: [], links: [] });
    const { info, gap } = await details(npm, base('no-licence'));
    expect(gap).toBeUndefined();
    expect(info.licenses).toEqual([]);
  });
});
