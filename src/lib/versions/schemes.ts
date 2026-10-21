import * as pep440 from '@renovatebot/pep440';
import semver from 'semver';
import { compareGeneric, validGeneric } from '#lib/versions/generic.ts';
import { compareMaven } from '#lib/versions/maven.ts';
import { compareNuget, validNuget } from '#lib/versions/nuget.ts';
import { compareGem, validGem } from '#lib/versions/rubygems.ts';

export type SchemeId = 'semver' | 'go' | 'pep440' | 'maven' | 'rubygems' | 'nuget' | 'generic';

export interface Scheme {
  id: SchemeId;
  name: string;
  /** false means comparisons are our best guess, and the UI says so */
  exact: boolean;
  /** the version as it should be written in an advisory, or null if it isn't one */
  clean: (version: string) => string | null;
  compare: (a: string, b: string) => number;
  /** what a valid version looks like, for error messages */
  example: string;
}

const stripV = (version: string) => version.trim().replace(/^v(?=\d)/i, '');

const semverScheme: Scheme = {
  id: 'semver',
  name: 'SemVer 2.0',
  exact: true,
  clean: (version) => (semver.valid(stripV(version)) ? stripV(version) : null),
  compare: (a, b) => semver.compare(stripV(a), stripV(b)),
  example: '1.4.2 or 2.0.0-rc.1'
};

export const schemes: Record<SchemeId, Scheme> = {
  semver: semverScheme,
  go: { ...semverScheme, id: 'go', name: 'Go modules (SemVer)', example: '1.9.1 or v1.9.1' },
  pep440: {
    id: 'pep440',
    name: 'PEP 440',
    exact: true,
    clean: (version) => (pep440.valid(version.trim()) ? version.trim() : null),
    compare: (a, b) => pep440.compare(a.trim(), b.trim()),
    example: '2.31.0, 1.0rc1 or 1.0.post1'
  },
  maven: {
    id: 'maven',
    name: 'Maven ComparableVersion',
    exact: true,
    clean: (version) => (/^[^\s,]+$/.test(version.trim()) ? version.trim() : null),
    compare: compareMaven,
    example: '2.17.1 or 6.0.0-M1'
  },
  rubygems: {
    id: 'rubygems',
    name: 'Gem::Version',
    exact: true,
    clean: (version) => (validGem(version) ? version.trim() : null),
    compare: compareGem,
    example: '7.1.3 or 7.2.0.beta1'
  },
  nuget: {
    id: 'nuget',
    name: 'NuGet (SemVer 2, up to four parts)',
    exact: true,
    clean: (version) => (validNuget(version) ? version.trim() : null),
    compare: compareNuget,
    example: '13.0.3 or 4.0.0.1'
  },
  generic: {
    id: 'generic',
    name: 'Generic (numbers, then pre-release letters)',
    exact: false,
    clean: (version) => (validGeneric(version) ? stripV(version) : null),
    compare: compareGeneric,
    example: '1.2.3'
  }
};
