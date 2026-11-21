import type { Outcome } from '#lib/net/fetch.ts';
import { lookupCve, type CveRecord, type IdState } from './cveorg.ts';
import { lookupEpss, type EpssScore } from './epss.ts';
import { advisoriesForCve, lookupAdvisory, type Advisory } from './github.ts';
import { lookupNvd, type NvdCve } from './nvd.ts';
import { lookupOsv, type OsvRecord } from './osv.ts';

const alias = (osv: Outcome<OsvRecord>, prefix: string) =>
  osv.status === 'ok' ? (osv.data.aliases.find((id) => id.startsWith(prefix)) ?? null) : null;

const asList = (advisory: Outcome<Advisory>): Outcome<Advisory[]> =>
  advisory.status === 'ok' ? { status: 'ok', data: [advisory.data] } : advisory;

// with no alias to go on there's nothing to ask GitHub, unless OSV never told us
const unasked = (osv: Outcome<OsvRecord>): Outcome<Advisory[]> =>
  osv.status === 'failed'
    ? { ...osv, message: "wasn't asked, since OSV didn't answer" }
    : { status: 'missing' };

/** one ID's worth of answers from every source, each landing as it arrives */
export class Lookup {
  cve = $state<string | null>(null);
  record = $state<Outcome<CveRecord>>();
  idState = $state<IdState>(null);
  nvd = $state<Outcome<NvdCve>>();
  github = $state<Outcome<Advisory[]>>();
  osv = $state<Outcome<OsvRecord>>();
  epss = $state<Outcome<EpssScore | null>>();

  readonly id: string;
  #token = 0;

  constructor(id: string) {
    this.id = id;
  }

  // stale answers from an earlier lookup get dropped on the floor
  #land<T>(token: number, promise: Promise<T>, set: (value: T) => void) {
    promise.then((value) => token === this.#token && set(value));
  }

  async run() {
    const token = ++this.#token;
    this.record = this.nvd = this.github = this.osv = this.epss = undefined;
    this.idState = null;
    const osv = lookupOsv(this.id);
    this.#land(token, osv, (value) => (this.osv = value));
    let cve: string | null = this.id;
    if (this.id.startsWith('GHSA-')) {
      const advisory = await lookupAdvisory(this.id);
      if (token !== this.#token) return;
      this.github = asList(advisory);
      // GitHub being down or rate limited shouldn't stop the CVE half, OSV knows the alias too
      if (advisory.status === 'ok') cve = advisory.data.cve;
      else cve = advisory.status === 'failed' ? alias(await osv, 'CVE-') : null;
    } else if (!this.id.startsWith('CVE-')) {
      const found = await osv;
      cve = alias(found, 'CVE-');
      const ghsa = alias(found, 'GHSA-');
      if (!cve) {
        const advisory = ghsa ? lookupAdvisory(ghsa).then(asList) : Promise.resolve(unasked(found));
        this.#land(token, advisory, (value) => (this.github = value));
      }
    }
    if (token !== this.#token) return;
    this.cve = cve;
    if (!cve) return;
    if (!this.github) {
      this.#land(token, advisoriesForCve(cve), (value) => (this.github = value));
    }
    this.#land(token, lookupCve(cve), ([record, idState]) => {
      this.idState = idState;
      this.record = record;
    });
    this.#land(token, lookupNvd(cve), (value) => (this.nvd = value));
    this.#land(token, lookupEpss([cve]), (value) => {
      this.epss =
        value.status === 'ok' ? { status: 'ok', data: value.data.get(cve) ?? null } : value;
    });
  }
}
