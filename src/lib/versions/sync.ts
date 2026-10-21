/** keeps page state and the URL in step: call url() and state() from two effects */
export function urlSync(delay = 400) {
  // what both sides last agreed on, so following and writing back never undo each other
  let agreed: string | null = null;

  return {
    /** the URL changed, so load it unless it's what we just wrote; load returns the new state */
    url(incoming: string, load: () => string) {
      if (incoming !== agreed) agreed = load();
    },
    /** page state changed, so write it after a pause; returns the cancel for the effect */
    state(target: string, save: () => void) {
      if (target === agreed) return;
      const timer = setTimeout(() => {
        agreed = target;
        save();
      }, delay);
      return () => clearTimeout(timer);
    }
  };
}
