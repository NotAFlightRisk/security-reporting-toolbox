// Maven's ComparableVersion ordering, ported from the Java
import { compareNumbers } from '#lib/versions/order.ts';

type Item = bigint | string | Item[];

const qualifiers = ['alpha', 'beta', 'milestone', 'rc', 'snapshot', '', 'sp'];
const aliases: Record<string, string> = { ga: '', final: '', release: '', cr: 'rc' };
const shortForms: Record<string, string> = { a: 'alpha', b: 'beta', m: 'milestone' };

function qualifier(text: string, followedByDigit: boolean) {
  if (followedByDigit && text in shortForms) return shortForms[text];
  return aliases[text] ?? text;
}

// known qualifiers sort by index, unknown ones after them alphabetically
const rank = (text: string) => {
  const index = qualifiers.indexOf(text);
  return index >= 0 ? String(index) : `${qualifiers.length}-${text}`;
};

const order = (a: string, b: string) => (a < b ? -1 : a > b ? 1 : 0);

const isNull = (item: Item) =>
  item === 0n || item === '' || (Array.isArray(item) && item.length === 0);

function normalise(list: Item[]) {
  for (let index = list.length - 1; index >= 0; index--) {
    if (isNull(list[index])) list.splice(index, 1);
    else if (!Array.isArray(list[index])) break;
  }
}

export function parseMaven(version: string): Item[] {
  const text = version.trim().toLowerCase();
  const root: Item[] = [];
  const stack = [root];
  let list = root;
  let digits = false;
  let start = 0;

  const token = (end: number, isNumber: boolean, followedByDigit = false) => {
    const part = text.slice(start, end);
    list.push(isNumber ? BigInt(part) : qualifier(part, followedByDigit));
  };
  const nest = () => {
    const child: Item[] = [];
    list.push(child);
    list = child;
    stack.push(child);
  };

  for (let index = 0; index < text.length; index++) {
    const char = text[index];
    if (char === '.' || char === '-') {
      if (index === start) list.push(0n);
      else token(index, digits);
      start = index + 1;
      if (char === '-') nest();
    } else if (/\d/.test(char)) {
      if (!digits && index > start) {
        token(index, false, true);
        start = index;
        nest();
      }
      digits = true;
    } else {
      if (digits && index > start) {
        token(index, true);
        start = index;
        nest();
      }
      digits = false;
    }
  }
  if (text.length > start) {
    // a trailing ".foo" is treated like "-foo"
    if (!digits && list.length > 0) nest();
    token(text.length, digits);
  }
  for (const each of stack.reverse()) normalise(each);
  return root;
}

function compareItems(left: Item | undefined, right: Item | undefined): number {
  if (left === undefined) return right === undefined ? 0 : -compareItems(right, undefined);
  if (typeof left === 'bigint') {
    if (right === undefined) return left === 0n ? 0 : 1;
    return typeof right === 'bigint' ? compareNumbers(left, right) : 1;
  }
  if (typeof left === 'string') {
    if (right === undefined) return order(rank(left), rank(''));
    return typeof right === 'string' ? order(rank(left), rank(right)) : -1;
  }
  if (right === undefined) return left.length === 0 ? 0 : compareItems(left[0], undefined);
  if (typeof right === 'bigint') return -1;
  if (typeof right === 'string') return 1;
  for (let index = 0; index < Math.max(left.length, right.length); index++) {
    const result = compareItems(left[index], right[index]);
    if (result !== 0) return result;
  }
  return 0;
}

export const compareMaven = (a: string, b: string) => compareItems(parseMaven(a), parseMaven(b));
