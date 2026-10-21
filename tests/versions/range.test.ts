import { describe, expect, it } from 'vitest';
import { ecosystem } from '#lib/ecosystems.ts';
import {
  decodeRanges,
  describe as sentence,
  encodeRanges,
  githubAffected,
  githubPatched,
  matching,
  osvAffected,
  parseGithub,
  schemeOf,
  validate,
  type Range
} from '#lib/versions/range.ts';

const span = (introduced: string, end: Range['end'], version = ''): Range => ({
  introduced,
  end,
  version
});

describe('GitHub affected and patched fields', () => {
  it.each([
    [span('', 'fixed', '3.3.23'), '< 3.3.23', '3.3.23'],
    [span('3.4.0-rc.0', 'last', '3.4.9'), '>= 3.4.0-rc.0, <= 3.4.9', ''],
    [span('1.1.2', 'fixed', '14.10.21'), '>= 1.1.2, < 14.10.21', '14.10.21'],
    [span('2.0.0', 'open'), '>= 2.0.0', ''],
    [span('', 'open'), '>= 0', ''],
    [span('', 'exact', '16.0.0-rc-1'), '= 16.0.0-rc-1', '']
  ])('%o renders as "%s"', (range, affected, patched) => {
    expect(githubAffected(range)).toBe(affected);
    expect(githubPatched(range)).toBe(patched);
  });
});

describe('reading GitHub range strings back in', () => {
  it.each([
    ['>= 1.0.0, < 1.2.3', span('1.0.0', 'fixed', '1.2.3')],
    ['>=1.0.0,<1.2.3', span('1.0.0', 'fixed', '1.2.3')],
    ['<= 2.0', span('', 'last', '2.0')],
    ['< v1.9.1', span('', 'fixed', '1.9.1')],
    ['= 1.4.2', span('', 'exact', '1.4.2')],
    ['>= 0', span('', 'open')],
    ['> 0, < 4.17.21', span('', 'fixed', '4.17.21')]
  ])('"%s"', (text, range) => {
    expect(parseGithub(text)).toEqual({ range });
  });

  it.each([
    ['> 2.0, < 2.3, > 3.0, < 3.2', 'one or two bounds'],
    ['> 1.2.0', 'Use ">="'],
    ['< 2.0, >= 1.0', 'lower bound'],
    ['= 1.0, < 2.0', 'on its own'],
    ['~1.2.3', "isn't a range"]
  ])('rejects "%s" with a fixable message', (text, hint) => {
    const result = parseGithub(text);
    expect('error' in result && result.error).toContain(hint);
  });
});

describe('testing versions against ranges', () => {
  const pip = schemeOf(ecosystem('pip')!);
  const npm = schemeOf(ecosystem('npm')!);
  const maven = schemeOf(ecosystem('maven')!);
  const ranges = [span('', 'fixed', '2.31.0'), span('2.32.0', 'last', '2.32.3')];

  it.each([
    ['2.30.0', 0],
    ['2.31.0rc1', 0],
    ['2.31.0', -1],
    ['2.31.0.post1', -1],
    ['2.32.0', 1],
    ['2.32.3', 1],
    ['2.32.4', -1]
  ])('PyPI %s matches range %i', (version, expected) => {
    expect(matching(ranges, version, pip)).toBe(expected);
  });

  it('counts a pre-release of the fix as affected, which is GitHub behaviour too', () => {
    expect(matching([span('', 'fixed', '2.0.0')], '2.0.0-rc.1', npm)).toBe(0);
  });

  it('uses Maven qualifiers, so the android branch patch covers jre too', () => {
    const guava = [span('', 'fixed', '32.0.0-android')];
    expect(matching(guava, '32.0.0-jre', maven)).toBe(-1);
    expect(matching(guava, '31.1-jre', maven)).toBe(0);
  });
});

describe('validation', () => {
  const npm = schemeOf(ecosystem('npm')!);
  const messages = (ranges: Range[]) => validate(ranges, npm).map((problem) => problem.message);

  it('passes a clean pair of ranges', () => {
    expect(validate([span('', 'fixed', '1.2.0'), span('2.0.0', 'fixed', '2.0.5')], npm)).toEqual(
      []
    );
  });

  it.each([
    [[span('1.2.0', 'fixed', '1.0.0')], 'has to come after'],
    [[span('1.2.0', 'fixed', '1.2.0')], 'has to come after'],
    [[span('2.0.0', 'last', '1.9.0')], 'backwards'],
    [[span('1.2', 'fixed', '1.3.0')], "isn't a valid SemVer"],
    [[span('', 'fixed', 'next')], 'start with a number'],
    [[span('1.0.0', 'fixed', '')], 'Fill in the fixed'],
    [[span('', 'fixed', '2.0.0'), span('1.5.0', 'fixed', '3.0.0')], 'Overlaps range 1'],
    [[span('', 'last', '2.0.0'), span('', 'exact', '2.0.0')], 'Overlaps range 1']
  ])('flags %o', (ranges, hint) => {
    expect(messages(ranges).join(' ')).toContain(hint);
  });

  it('ignores a row nobody has filled in yet', () => {
    expect(validate([span('', 'fixed', '1.2.0'), span('', 'fixed', '')], npm)).toEqual([]);
  });

  it("doesn't call back-to-back ranges an overlap", () => {
    expect(validate([span('', 'fixed', '2.0.0'), span('2.0.0', 'fixed', '2.1.0')], npm)).toEqual(
      []
    );
  });
});

describe('OSV output', () => {
  it('writes events, with exact versions in versions[]', () => {
    const ranges = [span('', 'fixed', '1.9.1'), span('', 'exact', '2.0.0')];
    expect(osvAffected(ecosystem('go')!, 'github.com/gin-gonic/gin', ranges)).toEqual({
      package: { ecosystem: 'Go', name: 'github.com/gin-gonic/gin' },
      ranges: [{ type: 'SEMVER', events: [{ introduced: '0' }, { fixed: '1.9.1' }] }],
      versions: ['2.0.0']
    });
  });

  it('uses last_affected and ECOSYSTEM ranges for PyPI', () => {
    expect(osvAffected(ecosystem('pip')!, 'requests', [span('2.32.0', 'last', '2.32.3')])).toEqual({
      package: { ecosystem: 'PyPI', name: 'requests' },
      ranges: [
        { type: 'ECOSYSTEM', events: [{ introduced: '2.32.0' }, { last_affected: '2.32.3' }] }
      ]
    });
  });
});

describe('plain English and URL round trips', () => {
  const ranges: Range[] = [
    span('1.0.0', 'fixed', '1.2.3'),
    span('', 'fixed', '0.9.0'),
    span('2.5.0', 'last', '2.6.1'),
    span('4.0.0', 'open'),
    span('', 'exact', '3.1.0')
  ];

  it('survives a trip through the URL', () => {
    expect(decodeRanges(encodeRanges(ranges))).toEqual(ranges);
  });

  it.each([
    [
      ranges[0],
      'Versions from 1.0.0 up to, but not including, 1.2.3 are affected. 1.2.3 has the fix.'
    ],
    [ranges[1], 'Every version before 0.9.0 is affected. 0.9.0 has the fix.'],
    [ranges[2], 'Versions from 2.5.0 up to and including 2.6.1 are affected.'],
    [ranges[3], 'Every version from 4.0.0 onwards is affected, with no fix yet.'],
    [ranges[4], 'Only 3.1.0 is affected.']
  ])('%o reads as "%s"', (range, text) => {
    expect(sentence(range)).toBe(text);
  });
});
