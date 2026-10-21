import { describe, expect, it } from 'vitest';
import { bucket, groupReferences, mergeReferences } from '#lib/sources/references.ts';
import { vectorVersion, weakness } from '#lib/sources/types.ts';

describe('weakness', () => {
  it.each([
    [
      'CWE-79 Improper Neutralization of Input',
      undefined,
      { id: 79, text: 'Improper Neutralization of Input' }
    ],
    [
      'CWE-502',
      'Deserialization of Untrusted Data',
      { id: 502, text: 'Deserialization of Untrusted Data' }
    ],
    ['cwe-20: Improper Input Validation', undefined, { id: 20, text: 'Improper Input Validation' }],
    ['NVD-CWE-noinfo', undefined, { id: null, text: 'Not enough information to pick a CWE' }],
    ['Information disclosure', undefined, { id: null, text: 'Information disclosure' }]
  ])('reads %j', (value, name, expected) => {
    expect(weakness(value, name)).toEqual(expected);
  });
});

describe('vectorVersion', () => {
  it.each([
    ['CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', '3.1'],
    ['CVSS:3.0/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H', '3.0'],
    ['CVSS:4.0/AV:N/AC:L/AT:N/PR:N/UI:N/VC:H/VI:H/VA:H/SC:N/SI:N/SA:N', '4.0'],
    ['AV:N/AC:M/Au:N/C:C/I:C/A:C', '2.0'],
    ['CVSS:5.0/AV:N', null],
    ['garbage', null]
  ])('%s is %s', (vector, version) => {
    expect(vectorVersion(vector)).toBe(version);
  });
});

describe('references', () => {
  it.each([
    [['vendor-advisory'], 'Advisory'],
    [['Third Party Advisory', 'VDB Entry'], 'Advisory'],
    [['Patch', 'Vendor Advisory'], 'Patch'],
    [['Exploit', 'Third Party Advisory'], 'Exploit'],
    [['mailing-list'], 'Discussion'],
    [['Issue Tracking'], 'Issue'],
    [[], 'Other']
  ])('files %j under %s', (tags, expected) => {
    expect(bucket(tags)).toBe(expected);
  });

  it('merges the same URL from two sources and keeps both sets of tags', () => {
    const merged = mergeReferences(
      [{ url: 'https://example.com/fix/', tags: ['patch'] }],
      [{ url: 'https://example.com/fix', name: 'The fix', tags: ['Patch', 'Vendor Advisory'] }]
    );
    expect(merged).toEqual([
      {
        url: 'https://example.com/fix/',
        name: 'The fix',
        tags: ['patch', 'Patch', 'Vendor Advisory']
      }
    ]);
    expect(groupReferences(merged).map((group) => group.name)).toEqual(['Patch']);
  });
});
