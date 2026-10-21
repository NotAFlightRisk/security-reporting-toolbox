export interface Converted {
  values: Record<string, string>;
  /** every place a human needs to check our working */
  checks: string[];
}

const rank: Record<string, number> = { N: 0, L: 1, H: 2 };
const worst = (a = 'N', b = 'N') => (rank[a] >= rank[b] ? a : b);

/** 3.x base and exploit maturity into 4.0, flagging the calls that need a human */
export function to40(from: Record<string, string>): Converted {
  const checks: string[] = [];
  const values: Record<string, string> = {
    AV: from.AV,
    AC: from.AC,
    AT: 'N',
    PR: from.PR,
    UI: from.UI === 'R' ? 'P' : from.UI,
    VC: from.C,
    VI: from.I,
    VA: from.A,
    SC: 'N',
    SI: 'N',
    SA: 'N'
  };

  checks.push(
    from.AC === 'H'
      ? "3.1's AC:H covers two things 4.0 splits up: beating defences like ASLR stays AC:H, while needing a race, a man in the middle or an unusual config is AT:P. We kept AC:H and set AT:N."
      : 'AT (Attack Requirements) has no 3.1 equivalent. We set None, change it to Present if the attack needs a race, a man in the middle or an unusual config.'
  );
  if (from.UI === 'R') {
    checks.push(
      'UI:R becomes Passive (P) or Active (A) in 4.0. We picked Passive, for everyday actions like opening a page. Pick Active if the victim has to go out of their way.'
    );
  }
  if (from.S === 'C') {
    values.SC = from.C;
    values.SI = from.I;
    values.SA = from.A;
    checks.push(
      'Scope changed: 4.0 splits impact between the vulnerable system and subsequent systems. We copied C/I/A into both, so work out which system really takes each hit (an XSS, say, is usually VC/VI:N with SC/SI:L).'
    );
  }
  const maturity: Record<string, string> = { H: 'A', F: 'P', P: 'P', U: 'U' };
  if (from.E && maturity[from.E]) {
    values.E = maturity[from.E];
    checks.push(
      "4.0 Exploit Maturity is about attacks, not code quality. E:A means attacks have actually been reported, so only keep it if that's true."
    );
  }
  for (const key of ['CR', 'IR', 'AR']) if (from[key]) values[key] = from[key];
  if (['RL', 'RC'].some((key) => from[key])) {
    checks.push(
      "Remediation Level and Report Confidence were dropped in 4.0, so they aren't carried over."
    );
  }
  if (Object.keys(from).some((key) => key.startsWith('M'))) {
    checks.push(
      "Modified (environmental) metrics weren't carried over. Set them again under More metrics."
    );
  }
  return { values, checks };
}

/** 4.0 base back to 3.1, which loses detail every way you cut it */
export function to31(from: Record<string, string>): Converted {
  const checks: string[] = [];
  const subsequent = ['SC', 'SI', 'SA'].some((key) => from[key] && from[key] !== 'N');
  const values: Record<string, string> = {
    AV: from.AV,
    AC: from.AT === 'P' ? 'H' : from.AC,
    PR: from.PR,
    UI: from.UI === 'N' ? 'N' : 'R',
    S: subsequent ? 'C' : 'U',
    C: worst(from.VC, from.SC),
    I: worst(from.VI, from.SI),
    A: worst(from.VA, from.SA)
  };
  if (from.AT === 'P')
    checks.push('AT:P has no 3.1 metric, so it became AC:H, which is how 3.1 usually showed it.');
  if (subsequent) {
    checks.push(
      'Subsequent system impact became Scope: Changed, with C/I/A taking the worst of each pair. Check the boundary really is crossed in 3.1 terms.'
    );
  }
  if (from.E)
    checks.push(
      "Threat metrics aren't carried over, since 3.1 Exploit Code Maturity means something different."
    );
  return { values, checks };
}
