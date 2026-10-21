import { sentryVitePlugin } from '@sentry/vite-plugin';
import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vitest/config';

const plausible = process.env.PUBLIC_PLAUSIBLE_SCRIPT ?? '';
const pulse = plausible ? [new URL(plausible).origin as `${string}.${string}`] : [];
const sentry = process.env.PUBLIC_SENTRY_DSN ?? '';
const oops = sentry ? [new URL(sentry).origin as `${string}.${string}`] : [];
const uploadMaps = Boolean(process.env.SENTRY_AUTH_TOKEN && process.env.SENTRY_URL);

// every API the tools call straight from the browser
const sources = [
  'https://services.nvd.nist.gov',
  'https://cveawg.mitre.org',
  'https://api.github.com',
  'https://api.osv.dev',
  'https://api.first.org',
  'https://raw.githubusercontent.com',
  'https://api.deps.dev',
  'https://registry.npmjs.org',
  'https://pypi.org',
  'https://crates.io',
  'https://api.nuget.org',
  'https://proxy.golang.org',
  'https://hex.pm',
  'https://pub.dev'
] as const;

export default defineConfig({
  define: {
    'import.meta.env.PUBLIC_PLAUSIBLE_SCRIPT': JSON.stringify(plausible),
    'import.meta.env.PUBLIC_SENTRY_DSN': JSON.stringify(sentry)
  },
  build: { sourcemap: uploadMaps && 'hidden' },
  plugins: [
    sveltekit({
      compilerOptions: {
        runes: ({ filename }) =>
          filename.split(/[/\\]/).includes('node_modules') ? undefined : true
      },
      adapter: adapter({ fallback: '404.html' }),
      paths: { relative: false },
      prerender: { entries: ['*', '/sitemap.xml', '/llms.txt'] },
      csp: {
        mode: 'hash',
        directives: {
          'default-src': ['self'],
          'script-src': ['self', ...pulse],
          'connect-src': ['self', ...sources, ...pulse, ...oops],
          'img-src': ['self', 'data:'],
          'style-src': ['self', 'unsafe-inline'],
          'font-src': ['self'],
          'base-uri': ['none'],
          'form-action': ['none'],
          'frame-ancestors': ['none']
        }
      }
    }),
    uploadMaps &&
      sentryVitePlugin({
        telemetry: false,
        release: { create: false, finalize: false, setCommits: false, deploy: false },
        bundleSizeOptimizations: { excludeDebugStatements: true, excludeTracing: true },
        sourcemaps: {
          assets: '.svelte-kit/output/client/**',
          filesToDeleteAfterUpload: '.svelte-kit/output/**/*.map'
        }
      })
  ],
  test: {
    include: ['tests/**/*.test.ts']
  }
});
