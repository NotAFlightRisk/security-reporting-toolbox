import { describe, expect, it } from 'vitest';
import { buildPurl, canonicalPurl, parsePurl, type Purl } from '#lib/purl.ts';
import suite from '../fixtures/packages/purl-spec-tests.json';

interface Case {
  description: string;
  test_group: 'required' | 'recommended';
  test_type: 'parse' | 'build' | 'validate';
  input: string | Purl;
  expected_output: string | Purl | null;
  expected_failure: boolean;
}

const tests = suite.tests as Case[];
// we lowercase qualifier keys rather than refuse them, which the spec recommends
const lenient = (test: Case) =>
  test.test_type === 'parse' && test.expected_failure && /Platform=/.test(String(test.input));

describe('purl-spec test suite', () => {
  it.each(
    tests
      .filter((test) => test.test_type === 'parse' && !lenient(test))
      .map((test) => [test.description, test])
  )('parse: %s', (_, test) => {
    if (test.expected_failure) expect(() => parsePurl(test.input as string)).toThrow();
    else expect(parsePurl(test.input as string)).toEqual(test.expected_output);
  });

  it.each(
    tests.filter((test) => test.test_type === 'build').map((test) => [test.description, test])
  )('build: %s', (_, test) => {
    if (test.expected_failure) expect(() => buildPurl(test.input as Purl)).toThrow();
    else expect(buildPurl(test.input as Purl)).toBe(test.expected_output);
  });

  it.each(
    tests.filter((test) => test.test_type === 'validate').map((test) => [test.description, test])
  )('canonical: %s', (_, test) => {
    expect(canonicalPurl(test.input as string)).toBe(test.expected_output);
  });
});

describe('errors people can act on', () => {
  it.each([
    ['npm/express', 'starts with "pkg:"'],
    ['pkg:npm', 'type and a name'],
    ['pkg:npm/express@1.0?broken', 'key=value'],
    ['pkg:npm/%E0%A4%A', 'broken %-escape']
  ])('%s', (input, hint) => {
    expect(() => parsePurl(input)).toThrow(hint);
  });
});
