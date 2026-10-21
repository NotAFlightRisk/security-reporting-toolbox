import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { urlSync } from '#lib/versions/sync.ts';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

// a page whose two effects call urlSync the way /versions does
function page(start: string) {
  const sync = urlSync();
  const world = { url: start, shown: '', saves: [] as string[], loads: 0 };
  let pending: (() => void) | undefined;
  const save = () => {
    world.saves.push(world.shown);
    navigate(world.shown);
  };
  const edited = () => {
    pending?.();
    pending = sync.state(world.shown, save);
  };
  // like Svelte, the write effect only reruns once the follow effect has finished
  const navigate = (url: string) => {
    world.url = url;
    const before = world.shown;
    sync.url(url, () => {
      world.loads++;
      world.shown = url;
      return url;
    });
    if (world.shown !== before) edited();
  };
  navigate(start);
  return {
    world,
    navigate,
    type: (text: string) => {
      world.shown = text;
      edited();
    }
  };
}

it('follows the URL to another state of the same page', () => {
  const { world, navigate } = page('ecosystem=npm&package=foo');
  navigate('ecosystem=pip&package=requests');
  vi.runAllTimers();
  expect(world.shown).toBe('ecosystem=pip&package=requests');
  expect(world.saves).toEqual([]);
});

it("lets Back win over an edit that hadn't been written yet", () => {
  const { world, navigate, type } = page('a');
  type('half typed');
  navigate('b');
  vi.runAllTimers();
  expect(world.shown).toBe('b');
  expect(world.url).toBe('b');
  expect(world.saves).toEqual([]);
});

it('writes an edit back once typing stops, and only once', () => {
  const { world, type } = page('a');
  type('ab');
  vi.advanceTimersByTime(200);
  type('abc');
  vi.runAllTimers();
  expect(world.saves).toEqual(['abc']);
  expect(world.url).toBe('abc');
  vi.runAllTimers();
  expect(world.saves).toEqual(['abc']);
});

it("doesn't reload the page from its own write", () => {
  const { world, type } = page('a');
  type('mine');
  vi.runAllTimers();
  expect(world.url).toBe('mine');
  expect(world.loads).toBe(1);
});
