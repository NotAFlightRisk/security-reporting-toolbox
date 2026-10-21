import { describe, expect, it } from 'vitest';
import { describeVersion, parseCveRecord } from '#lib/sources/cveorg.ts';
import { fixture } from './helpers.ts';

describe('parseCveRecord', () => {
  it('reads a published record with CISA-ADP enrichment', () => {
    const record = parseCveRecord(fixture('cveorg-log4shell'))!;
    expect(record).toMatchObject({ id: 'CVE-2021-44228', state: 'PUBLISHED', assigner: 'apache' });
    expect(record.cna.scores).toEqual([]);
    expect(record.cna.weaknesses.map((item) => item.id)).toEqual([502, 400, 20]);
    expect(record.cna.weaknesses[0].text).toBe('Deserialization of Untrusted Data');
    const cisa = record.adp.find((adp) => adp.name === 'CISA-ADP')!;
    expect(cisa.scores).toEqual([
      { version: '3.1', vector: 'CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H', score: 10 }
    ]);
    expect(cisa.kevAdded).toBe('2021-12-10');
    expect(cisa.ssvc).toEqual({ exploitation: 'active', automatable: 'yes', impact: 'total' });
  });

  it.each([
    ['cveorg-0001', '3.1', 6],
    ['cveorg-gh-v4', '4.0', 8.6]
  ])('takes the CNA score from %s', (name, version, score) => {
    expect(parseCveRecord(fixture(name))!.cna.scores[0]).toMatchObject({ version, score });
  });

  it('keeps a rejected record, with its reason and no description', () => {
    const record = parseCveRecord(fixture('cveorg-rejected'))!;
    expect(record.state).toBe('REJECTED');
    expect(record.rejectedReason).toMatch(/reservation duplicate of CVE-2004-1123/);
    expect(record.description).toBe('');
    expect(record.affected).toEqual([]);
  });

  it.each([null, 'nope', {}, { cveMetadata: {} }, { containers: {} }])(
    'gives up on %j rather than inventing a record',
    (input) => expect(parseCveRecord(input)).toBeNull()
  );

  it('survives containers with the wrong shapes', () => {
    const record = parseCveRecord({
      cveMetadata: { cveId: 'CVE-2024-0001', state: 'PUBLISHED' },
      containers: { cna: { metrics: 'x', problemTypes: [{ descriptions: null }], affected: {} } }
    })!;
    expect(record.cna.scores).toEqual([]);
    expect(record.cna.weaknesses).toEqual([]);
    expect(record.affected).toEqual([]);
  });
});

describe('describeVersion', () => {
  it.each([
    [{ version: '0', lessThan: '2.15.0', status: 'affected' }, 'all versions to before 2.15.0'],
    [{ version: '1.2', lessThanOrEqual: '1.4', status: 'affected' }, '1.2 to and including 1.4'],
    [{ version: '7.9 All', status: 'unaffected' }, '7.9 All'],
    [{ status: 'affected' }, 'unspecified']
  ])('reads %j as "%s"', (entry, text) => {
    expect(describeVersion(entry)[0].text).toBe(text);
  });

  it('lists the changes after the range, so 2.12.2 shows up as fixed', () => {
    const [, ...changes] = describeVersion({
      version: '2.0-beta9',
      lessThan: 'log4j-core*',
      status: 'affected',
      changes: [
        { at: '2.3.1', status: 'unaffected' },
        { at: '2.4', status: 'affected' }
      ]
    });
    expect(changes).toEqual([
      { status: 'unaffected', text: 'from 2.3.1' },
      { status: 'affected', text: 'from 2.4' }
    ]);
  });
});
