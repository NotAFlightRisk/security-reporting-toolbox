import { afterEach, describe, expect, it, vi } from 'vitest';
import { parseCveRecord } from '#lib/sources/cveorg.ts';
import { lookupEpss, parseEpss } from '#lib/sources/epss.ts';
import { advisoriesForCve } from '#lib/sources/github.ts';
import { crossCheck } from '#lib/sources/kev.ts';
import { lookupNvd, parseNvdPage } from '#lib/sources/nvd.ts';
import { fakeFetch, fixture } from './helpers.ts';

afterEach(() => vi.unstubAllGlobals());

describe('CVE.org defaultStatus', () => {
  it('keeps the status of every version not listed', () => {
    const record = parseCveRecord({
      cveMetadata: { cveId: 'CVE-2024-0001', state: 'PUBLISHED' },
      containers: {
        cna: {
          affected: [
            {
              vendor: 'Example',
              product: 'Widget',
              defaultStatus: 'affected',
              versions: [{ version: '2.5.2', status: 'unaffected' }]
            },
            { vendor: 'Example', product: 'Gadget', versions: [] }
          ]
        }
      }
    })!;
    expect(record.affected.map((product) => product.defaultStatus)).toEqual(['affected', null]);
  });

  it('reads it off a real Palo Alto record', () => {
    const [cortex] = parseCveRecord(fixture('cveorg-0001'))!.affected;
    expect(cortex.defaultStatus).toBe('unaffected');
  });
});

describe('an answer we cannot read is bad data, never missing', () => {
  it.each([
    [{ totalResults: 1, vulnerabilities: [{}] }],
    [{ totalResults: 1, vulnerabilities: [] }]
  ])('NVD %j', async (body) => {
    fakeFetch([[/cveId=CVE-2024-7777/, 200, body]]);
    expect(await lookupNvd('CVE-2024-7777')).toMatchObject({
      status: 'failed',
      reason: 'bad-data'
    });
  });

  it('NVD pages with an unreadable row', () => {
    expect(
      parseNvdPage({ totalResults: 2, vulnerabilities: [{ cve: { id: 'CVE-2024-1' } }, {}] })
    ).toBeNull();
  });

  it('GitHub [{}]', async () => {
    fakeFetch([[/cve_id=CVE-2024-8888/, 200, [{}]]]);
    expect(await advisoriesForCve('CVE-2024-8888')).toMatchObject({
      status: 'failed',
      reason: 'bad-data'
    });
  });

  it.each([null, '', true, 'abc', [], {}])('EPSS value %j', (epss) => {
    const data = [{ cve: 'CVE-2024-1', epss, percentile: '0.5', date: '2026-10-21' }];
    expect(parseEpss({ data })).toBeNull();
  });

  it.each([0, '0.000430000', 1])('EPSS still takes %j', (epss) => {
    const data = [{ cve: 'CVE-2024-1', epss, percentile: 0.5, date: '2026-10-21' }];
    expect(parseEpss({ data })![0].probability).toBe(Number(epss));
  });

  it('an EPSS null fails the lookup instead of scoring it 0', async () => {
    const data = [{ cve: 'CVE-2024-9999', epss: null, percentile: null, date: '2026-10-21' }];
    fakeFetch([[/epss\?cve=CVE-2024-9999/, 200, { data }]]);
    expect(await lookupEpss(['CVE-2024-9999'])).toMatchObject({
      status: 'failed',
      reason: 'bad-data'
    });
  });
});

describe('KEV cross-check with NVD', () => {
  const nvd = parseNvdPage(fixture('nvd-webp'))!.items[0];

  it.each([
    [{ status: 'ok', data: { ...nvd, kev: null } }, 'agrees'],
    [{ status: 'ok', data: nvd }, 'listed'],
    [{ status: 'missing' }, 'unknown'],
    [{ status: 'failed', reason: 'network', message: 'x' }, 'failed']
  ] as const)('reads %j as %s', (outcome, kind) => {
    expect(crossCheck(outcome).kind).toBe(kind);
  });
});
