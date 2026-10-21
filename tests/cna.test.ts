import { describe, expect, it } from 'vitest';
import { normalise, search, type Cna } from '#lib/cna.ts';
import raw from './fixtures/cna.json';

const cnas = raw.map((record) => normalise(record)).filter((cna): cna is Cna => cna !== null);
const names = (found: Cna[]) => found.map((cna) => cna.shortName);

describe('normalise', () => {
  it('flattens a real record', () => {
    const github = cnas.find((cna) => cna.shortName === 'GitHub_M')!;
    expect(github.org).toBe('GitHub, Inc.');
    expect(github.types).toEqual(['Vendor', 'Open Source', 'Researcher']);
    expect(github.emails).toEqual(['security-advisories@github.com']);
    expect(github.policies[0].url).toMatch(/^https:\/\//);
  });

  it.each([
    ['no organisation name', { shortName: 'x' }],
    ['no short name', { organizationName: 'X Ltd' }],
    ['names that are not strings', { shortName: 4, organizationName: ['X'] }]
  ])('drops a record with %s', (_, record) => {
    expect(normalise(record)).toBeNull();
  });

  it('survives junk in the nested fields', () => {
    const cna = normalise({
      shortName: 'junk',
      organizationName: 'Junk Ltd',
      CNA: { type: 'Vendor', roles: [null, { role: 'CNA' }], root: { organizationName: 'n/a' } },
      contact: [
        { email: [{ emailAddr: 'not an email' }], contact: [{ url: 'javascript:alert(1)' }] }
      ]
    });
    expect(cna).toMatchObject({ types: [], roles: ['CNA'], root: '', emails: [], links: [] });
  });
});

describe('search', () => {
  const none = { query: '', type: '', role: '' };

  it.each([
    ['an exact short name first', 'apache', 'apache'],
    ['a product only named in a scope', 'wordpress', 'Wordfence'],
    ['accents and case ignored', 'GITHUB', 'GitHub_M'],
    ['every word has to match', 'industrial control', 'icscert']
  ])('finds %s', (_, query, first) => {
    expect(names(search(cnas, { ...none, query }))[0]).toBe(first);
  });

  it('returns nothing when one word matches nobody', () => {
    expect(search(cnas, { ...none, query: 'wordpress zzzz' })).toEqual([]);
  });

  it('filters by role, so last resort CNAs can be listed on their own', () => {
    expect(names(search(cnas, { ...none, role: 'CNA-LR' })).sort()).toEqual(['icscert', 'mitre']);
  });

  it('filters by type and query together', () => {
    expect(names(search(cnas, { query: 'github', type: 'Open Source', role: '' }))).toEqual([
      'GitHub_M'
    ]);
  });
});
