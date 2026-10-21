import { describe, expect, it } from 'vitest';
import { groupRelated } from '#lib/cwe/related.ts';
import { linkify, summarise } from '#lib/cwe/text.ts';

describe('linkify', () => {
  it('splits out every CWE reference', () => {
    expect(linkify('a duplicate of CWE-908. See CWE-457 too')).toEqual([
      { text: 'a duplicate of ' },
      { text: 'CWE-908', id: 908 },
      { text: '. See ' },
      { text: 'CWE-457', id: 457 },
      { text: ' too' }
    ]);
  });

  it.each(['', 'nothing to link here', 'CWE79 is not a reference'])('leaves %j alone', (text) => {
    expect(linkify(text).every((part) => part.id === undefined)).toBe(true);
  });
});

describe('summarise', () => {
  it('cuts long text on a word boundary', () => {
    const text =
      'The product does not neutralize or incorrectly neutralizes user-controllable input';
    expect(summarise(text, 40)).toBe('The product does not neutralize or...');
  });

  it('leaves short text untouched', () => {
    expect(summarise('Short.', 40)).toBe('Short.');
  });
});

describe('groupRelated', () => {
  it('groups by relationship in reading order and drops empty groups', () => {
    const groups = groupRelated({
      related: [
        { nature: 'PeerOf', id: 352, view: '1000' },
        { nature: 'ChildOf', id: 74, view: '1000' },
        { nature: 'CanPrecede', id: 494, view: '1000' },
        { nature: 'ChildOf', id: 74, view: '1000' }
      ],
      children: [80, 81]
    });
    expect(groups).toEqual([
      { label: 'Parents', ids: [74] },
      { label: 'Children', ids: [80, 81] },
      { label: 'Peers', ids: [352] },
      { label: 'Can lead to', ids: [494] }
    ]);
  });
});
