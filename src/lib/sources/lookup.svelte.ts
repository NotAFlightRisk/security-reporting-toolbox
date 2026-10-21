import type { Outcome } from '#lib/net/fetch.ts';
import { lookupCveRecord, type CveRecord } from './cveorg.ts';
import { lookupEpss, type EpssScore } from './epss.ts';
import { advisoriesForCve, lookupAdvisory, type Advisory } from './github.ts';
import { lookupNvd, type NvdCve } from './nvd.ts';
import { lookupOsv, type OsvRecord } from './osv.ts';

/** one ID's worth of answers from every source, each landing as it arrives */
export class Lookup {
  cve = $state<string | null>(null);
  record = $state<Outcome<CveRecord>>();
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
    this.#land(token, lookupOsv(this.id), (value) => (this.osv = value));
    if (this.id.startsWith('GHSA-')) {
      const advisory = await lookupAdvisory(this.id);
      if (token !== this.#token) return;
      this.github = advisory.status === 'ok' ? { status: 'ok', data: [advisory.data] } : advisory;
      this.cve = advisory.status === 'ok' ? advisory.data.cve : null;
    } else {
      this.cve = this.id;
      this.#land(token, advisoriesForCve(this.id), (value) => (this.github = value));
    }
    const cve = this.cve;
    if (!cve) return;
    this.#land(token, lookupCveRecord(cve), (value) => (this.record = value));
    this.#land(token, lookupNvd(cve), (value) => (this.nvd = value));
    this.#land(token, lookupEpss([cve]), (value) => {
      this.epss =
        value.status === 'ok' ? { status: 'ok', data: value.data.get(cve) ?? null } : value;
    });
  }
}
