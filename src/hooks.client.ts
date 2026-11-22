import type { HandleClientError } from '@sveltejs/kit/hooks';

const dsn = import.meta.env.PUBLIC_SENTRY_DSN;
let sentry: Promise<(error: unknown) => void> | undefined;

// the SDK only downloads once something's broken, and a failed load just drops the report
function report(error: unknown) {
  sentry ??= import('#lib/sentry.ts').then(({ start }) => start(dsn)).catch(() => () => {});
  sentry.then((capture) => capture(error));
}

if (dsn) {
  addEventListener('error', (event) => event.error && report(event.error));
  addEventListener('unhandledrejection', (event) => report(event.reason));
}

// Chromium, Firefox, Safari, then Vite's CSS preload
const unloaded = /dynamically imported module|module script failed|unable to preload/i;

export const handleError: HandleClientError = ({ kind, error }) => {
  if (kind !== 'unknown') return;
  if (dsn) report(error);
  if (error instanceof Error && unloaded.test(error.message)) return { unloaded: true };
};
