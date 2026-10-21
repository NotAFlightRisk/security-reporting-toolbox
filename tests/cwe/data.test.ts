import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, describe, expect, it } from 'vitest';
import type { Catalogue } from '#lib/cwe/types.ts';
import { cweEntry, cweViews } from '#lib/server/cwe.ts';

const scratch = mkdtempSync(join(tmpdir(), 'cwe-'));
afterAll(() => rmSync(scratch, { recursive: true, force: true }));

function convert(): Catalogue {
  const out = join(scratch, 'cwe.json');
  execFileSync(
    'python3',
    ['scripts/cwe.py', '--xml', 'tests/cwe/fixtures/excerpt.xml', '--out', out],
    {
      stdio: 'pipe'
    }
  );
  return JSON.parse(readFileSync(out, 'utf8'));
}

describe('scripts/cwe.py on a real excerpt of CWE 4.20', () => {
  const data = convert();
  const byId = new Map(data.weaknesses.map((entry) => [entry.id, entry]));

  it('keeps the catalogue version and date', () => {
    expect([data.version, data.date]).toEqual(['4.20', '2026-04-30']);
  });

  it('flattens xhtml into paragraphs and lists', () => {
    const extended = byId.get(707)!.extended;
    expect(extended[0]).toBe(
      'If a message is malformed, it may cause the message to be incorrectly interpreted.'
    );
    expect(extended[2]).toHaveLength(4);
    expect((extended[2] as string[])[0]).toBe(
      'checking that the input/output is already "safe" (e.g. validation)'
    );
  });

  it('strips reference markers out of prose', () => {
    const text = JSON.stringify(data.weaknesses);
    expect(text).not.toMatch(/\[REF-\d+\]/);
  });

  it('only keeps research view relationships and works out children', () => {
    expect(byId.get(79)!.related.every((link) => link.view === '1000')).toBe(true);
    expect(byId.get(74)!.children).toContain(79);
    expect(byId.get(79)!.children).toContain(80);
  });

  it('builds category columns for OWASP and pillar columns for the Top 25', () => {
    const [top25, owasp] = data.views;
    expect(top25.columns).toEqual([{ id: 707, name: 'Improper Neutralization', members: [79] }]);
    expect(owasp.columns).toEqual([
      { id: 1347, name: 'A03:2021 - Injection', members: [74, 79, 80] }
    ]);
  });

  it('keeps mapping guidance and deprecation notes', () => {
    expect(byId.get(79)!.mapping?.usage).toBe('Allowed');
    expect(byId.get(1187)!.status).toBe('Deprecated');
    expect(byId.get(1187)!.description).toContain('CWE-908');
  });
});

describe('the shipped catalogue', () => {
  it('has all 25 Top 25 entries and ten OWASP categories', () => {
    const [top25, owasp] = cweViews();
    expect(top25.columns.flatMap((column) => column.members)).toHaveLength(25);
    expect(owasp.columns.map((column) => column.name.slice(0, 3))).toEqual([
      'A01',
      'A02',
      'A03',
      'A04',
      'A05',
      'A06',
      'A07',
      'A08',
      'A09',
      'A10'
    ]);
  });

  it('names everything an entry page links to', () => {
    const page = cweEntry(1187)!;
    expect(page.names[908]).toBe('Use of Uninitialized Resource');
    const xss = cweEntry(79)!;
    expect(xss.names[74]).toMatch(/Injection/);
    expect(xss.views.map((view) => view.id)).toContain(1435);
  });

  it('has no page for views or unknown IDs', () => {
    expect(cweEntry(1003)).toBeNull();
    expect(cweEntry(99999)).toBeNull();
  });
});
