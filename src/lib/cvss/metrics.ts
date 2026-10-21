export type Version = '2.0' | '3.0' | '3.1' | '4.0';
export type Group = 'base' | 'temporal' | 'threat' | 'environmental' | 'supplemental';

export interface Value {
  key: string;
  name: string;
  about: string;
}

export interface Metric {
  key: string;
  name: string;
  group: Group;
  /** a heading within the group, e.g. "Vulnerable system" in 4.0 base */
  part?: string;
  about: string;
  values: Value[];
}

export const groupNames: Record<Group, string> = {
  base: 'Base',
  temporal: 'Temporal',
  threat: 'Threat',
  environmental: 'Environmental',
  supplemental: 'Supplemental'
};

const notDefined: Value = {
  key: 'X',
  name: 'Not Defined',
  about: 'Leave it out. It has no effect on the score.'
};

const v = (key: string, name: string, about: string): Value => ({ key, name, about });

const attackVector = (local: string) => [
  v('N', 'Network', 'Exploitable remotely, across routers, up to the whole internet.'),
  v('A', 'Adjacent', 'Needs the same local network, Bluetooth range or similar shared hop.'),
  v('L', 'Local', local),
  v('P', 'Physical', 'The attacker has to physically touch the device.')
];

const privileges = [
  v('N', 'None', 'No account or login needed before attacking.'),
  v('L', 'Low', 'Needs a basic user account, like any signed-up user.'),
  v('H', 'High', 'Needs admin or other significant rights over the component.')
];

const impact = (what: string) => [
  v('H', 'High', `Total loss of ${what}, or a serious chunk of it.`),
  v('L', 'Low', `Some loss of ${what}, but limited in amount or control.`),
  v('N', 'None', `No loss of ${what}.`)
];

const requirement = (what: string) => [
  notDefined,
  v('H', 'High', `Losing ${what} would be catastrophic for this organisation.`),
  v('M', 'Medium', `Losing ${what} would be serious.`),
  v('L', 'Low', `Losing ${what} would only have a limited effect.`)
];

/** a modified copy of a base metric, for the environmental group */
const modified = (metric: Metric, extra: Value[] = []): Metric => ({
  ...metric,
  key: `M${metric.key}`,
  name: `Modified ${metric.name}`,
  group: 'environmental',
  about: `${metric.name} as it applies in your environment, after your own mitigations.`,
  values: [notDefined, ...extra, ...metric.values]
});

const av3: Metric = {
  key: 'AV',
  name: 'Attack Vector',
  group: 'base',
  about: 'How far away the attacker can be.',
  values: attackVector('Needs local access (shell, SSH, console), or a user to open something.')
};
const ac3: Metric = {
  key: 'AC',
  name: 'Attack Complexity',
  group: 'base',
  about: "Conditions outside the attacker's control that have to line up for it to work.",
  values: [
    v('L', 'Low', 'Works every time, no special conditions.'),
    v('H', 'High', 'Needs preparation or luck, like winning a race or knowing a secret value.')
  ]
};
const pr3: Metric = {
  key: 'PR',
  name: 'Privileges Required',
  group: 'base',
  about: 'What access the attacker needs before they start.',
  values: privileges
};
const ui3: Metric = {
  key: 'UI',
  name: 'User Interaction',
  group: 'base',
  about: 'Whether someone other than the attacker has to do something.',
  values: [
    v('N', 'None', 'No victim action needed.'),
    v('R', 'Required', 'A user has to click, open or install something.')
  ]
};
const s3: Metric = {
  key: 'S',
  name: 'Scope',
  group: 'base',
  about: "Whether the impact reaches beyond the vulnerable component's security boundary.",
  values: [
    v('U', 'Unchanged', 'Only the vulnerable component (and things it manages) is affected.'),
    v('C', 'Changed', "It breaks out, e.g. a VM escape or XSS hitting the user's browser.")
  ]
};
const cia3 = (key: string, name: string, what: string): Metric => ({
  key,
  name,
  group: 'base',
  about: `Impact on ${what}.`,
  values: impact(what)
});
const base3 = [
  av3,
  ac3,
  pr3,
  ui3,
  s3,
  cia3('C', 'Confidentiality', 'the confidentiality of data'),
  cia3('I', 'Integrity', 'the integrity of data'),
  cia3('A', 'Availability', 'availability')
];

const metrics3: Metric[] = [
  ...base3,
  {
    key: 'E',
    name: 'Exploit Code Maturity',
    group: 'temporal',
    about: 'How far along working exploit code is.',
    values: [
      notDefined,
      v('H', 'High', 'Reliable exploits exist and work in practice, or no exploit is needed.'),
      v('F', 'Functional', 'Working exploit code is available.'),
      v('P', 'Proof-of-Concept', 'A PoC exists but needs work to be practical.'),
      v('U', 'Unproven', "No exploit code, or it's purely theoretical.")
    ]
  },
  {
    key: 'RL',
    name: 'Remediation Level',
    group: 'temporal',
    about: 'What fix is available.',
    values: [
      notDefined,
      v('U', 'Unavailable', 'No fix and no workaround.'),
      v('W', 'Workaround', 'An unofficial, non-vendor fix exists.'),
      v('T', 'Temporary Fix', 'An official temporary fix or hotfix.'),
      v('O', 'Official Fix', 'A full vendor patch or upgrade is out.')
    ]
  },
  {
    key: 'RC',
    name: 'Report Confidence',
    group: 'temporal',
    about: 'How sure we are the vulnerability is real and the details are right.',
    values: [
      notDefined,
      v('C', 'Confirmed', 'Vendor confirmed, or reproduced, or the code is public.'),
      v('R', 'Reasonable', 'Significant details published, root cause not fully known.'),
      v('U', 'Unknown', 'Reports of impact but conflicting or unclear details.')
    ]
  },
  req('CR', 'Confidentiality', 'confidentiality'),
  req('IR', 'Integrity', 'integrity'),
  req('AR', 'Availability', 'availability'),
  ...base3.map((metric) => modified(metric))
];

function req(key: string, name: string, what: string) {
  return {
    key,
    name: `${name} Requirement`,
    group: 'environmental' as const,
    about: `How much ${what} of the affected asset matters to the organisation.`,
    values: requirement(what)
  };
}

const av4: Metric = {
  ...av3,
  part: 'Exploitability',
  values: attackVector('Needs local access (shell, console), or a user to open something.')
};
const exploitability4: Metric[] = [
  av4,
  {
    ...ac3,
    part: 'Exploitability',
    about: 'Built-in defences the attacker has to get around.',
    values: [
      v('L', 'Low', 'Nothing to get around, it works reliably.'),
      v(
        'H',
        'High',
        'Has to beat a defence like ASLR or DEP, or get hold of a target-specific secret.'
      )
    ]
  },
  {
    key: 'AT',
    name: 'Attack Requirements',
    group: 'base',
    part: 'Exploitability',
    about: 'Conditions of the deployment that have to be true, like a race or a man in the middle.',
    values: [
      v('N', 'None', 'Works without any special deployment or execution conditions.'),
      v('P', 'Present', 'Needs a particular setup, timing or position on the network.')
    ]
  },
  { ...pr3, part: 'Exploitability' },
  {
    key: 'UI',
    name: 'User Interaction',
    group: 'base',
    part: 'Exploitability',
    about: 'Whether a human other than the attacker has to take part.',
    values: [
      v('N', 'None', 'No victim action needed.'),
      v('P', 'Passive', 'The user does something ordinary, like visiting a page.'),
      v('A', 'Active', 'The user has to go out of their way, like dismissing warnings.')
    ]
  }
];
const impact4 = (prefix: 'V' | 'S', part: string, where: string): Metric[] =>
  [
    ['C', 'Confidentiality', 'the confidentiality of data'],
    ['I', 'Integrity', 'the integrity of data'],
    ['A', 'Availability', 'availability']
  ].map(([key, name, what]) => ({
    key: `${prefix}${key}`,
    name: `${name} (${prefix === 'V' ? 'vulnerable' : 'subsequent'})`,
    group: 'base',
    part,
    about: `Impact on ${what} ${where}.`,
    values: impact(what)
  }));
const base4 = [
  ...exploitability4,
  ...impact4('V', 'Vulnerable system', 'of the vulnerable system itself'),
  ...impact4('S', 'Subsequent system', 'of other systems beyond it')
];
const safety = v('S', 'Safety', 'Could hurt people, as defined by IEC 61508.');

const metrics4: Metric[] = [
  ...base4,
  {
    key: 'E',
    name: 'Exploit Maturity',
    group: 'threat',
    about: "Whether it's being attacked, from threat intel.",
    values: [
      notDefined,
      v('A', 'Attacked', 'Attacks have been reported, or exploit kits exist.'),
      v('P', 'POC', 'A public proof of concept exists, no known attacks.'),
      v('U', 'Unreported', 'No PoC and no reported attacks.')
    ]
  },
  req('CR', 'Confidentiality', 'confidentiality'),
  req('IR', 'Integrity', 'integrity'),
  req('AR', 'Availability', 'availability'),
  ...base4.map((metric) =>
    modified(metric, metric.key === 'SI' || metric.key === 'SA' ? [safety] : [])
  ),
  {
    key: 'S',
    name: 'Safety',
    group: 'supplemental',
    about: "Whether exploiting it could hurt people. Doesn't change the score.",
    values: [
      notDefined,
      v('N', 'Negligible', 'Consequences meet the IEC 61508 "negligible" category at worst.'),
      v('P', 'Present', 'Consequences could be worse than negligible.')
    ]
  },
  {
    key: 'AU',
    name: 'Automatable',
    group: 'supplemental',
    about: 'Whether an attacker could script the whole attack across many targets.',
    values: [
      notDefined,
      v('N', 'No', "At least one step can't be reliably automated."),
      v('Y', 'Yes', "Every step can be automated, so it's wormable.")
    ]
  },
  {
    key: 'R',
    name: 'Recovery',
    group: 'supplemental',
    about: 'How the system recovers availability after an attack.',
    values: [
      notDefined,
      v('A', 'Automatic', 'Recovers by itself.'),
      v('U', 'User', 'Needs a person to step in.'),
      v('I', 'Irrecoverable', "It can't be recovered.")
    ]
  },
  {
    key: 'V',
    name: 'Value Density',
    group: 'supplemental',
    about: 'How much an attacker gets from one successful attack.',
    values: [
      notDefined,
      v('D', 'Diffuse', "Small pickings per target, like one user's device."),
      v('C', 'Concentrated', 'Rich pickings, like a central database or server.')
    ]
  },
  {
    key: 'RE',
    name: 'Vulnerability Response Effort',
    group: 'supplemental',
    about: 'How hard it is for consumers to respond to it.',
    values: [
      notDefined,
      v('L', 'Low', 'Little effort, like a config change or quick update.'),
      v('M', 'Moderate', 'Some effort and maybe some downtime.'),
      v('H', 'High', 'Significant effort, like replacing hardware.')
    ]
  },
  {
    key: 'U',
    name: 'Provider Urgency',
    group: 'supplemental',
    about: "The supplier's own view of how urgent it is.",
    values: [
      notDefined,
      v('Clear', 'Clear', 'No urgency, informational only.'),
      v('Green', 'Green', 'Reduced urgency.'),
      v('Amber', 'Amber', 'Moderate urgency.'),
      v('Red', 'Red', 'Highest urgency.')
    ]
  }
];

const nd = v('ND', 'Not Defined', 'Leave it out.');
const metrics2: Metric[] = [
  {
    key: 'AV',
    name: 'Access Vector',
    group: 'base',
    about: 'How the vulnerability is reached.',
    values: [
      v('L', 'Local', 'Needs local access.'),
      v('A', 'Adjacent Network', 'Needs the local network.'),
      v('N', 'Network', 'Remotely exploitable.')
    ]
  },
  {
    key: 'AC',
    name: 'Access Complexity',
    group: 'base',
    about: 'How hard the attack is once access is gained.',
    values: [v('H', 'High', 'Hard.'), v('M', 'Medium', 'Somewhat hard.'), v('L', 'Low', 'Easy.')]
  },
  {
    key: 'Au',
    name: 'Authentication',
    group: 'base',
    about: 'How many times the attacker has to log in.',
    values: [
      v('M', 'Multiple', 'Twice or more.'),
      v('S', 'Single', 'Once.'),
      v('N', 'None', 'Not at all.')
    ]
  },
  ...(
    [
      ['C', 'Confidentiality Impact'],
      ['I', 'Integrity Impact'],
      ['A', 'Availability Impact']
    ] as const
  ).map(([key, name]) => ({
    key,
    name,
    group: 'base' as const,
    about: `${name.replace(' Impact', '')} lost.`,
    values: [v('N', 'None', 'None.'), v('P', 'Partial', 'Some.'), v('C', 'Complete', 'All of it.')]
  })),
  {
    key: 'E',
    name: 'Exploitability',
    group: 'temporal',
    about: 'Exploit availability.',
    values: [
      v('U', 'Unproven', ''),
      v('POC', 'Proof-of-Concept', ''),
      v('F', 'Functional', ''),
      v('H', 'High', ''),
      nd
    ]
  },
  {
    key: 'RL',
    name: 'Remediation Level',
    group: 'temporal',
    about: 'Fix availability.',
    values: [
      v('OF', 'Official Fix', ''),
      v('TF', 'Temporary Fix', ''),
      v('W', 'Workaround', ''),
      v('U', 'Unavailable', ''),
      nd
    ]
  },
  {
    key: 'RC',
    name: 'Report Confidence',
    group: 'temporal',
    about: 'Confidence in the report.',
    values: [v('UC', 'Unconfirmed', ''), v('UR', 'Uncorroborated', ''), v('C', 'Confirmed', ''), nd]
  },
  {
    key: 'CDP',
    name: 'Collateral Damage Potential',
    group: 'environmental',
    about: 'Potential for loss of life or property.',
    values: [
      v('N', 'None', ''),
      v('L', 'Low', ''),
      v('LM', 'Low-Medium', ''),
      v('MH', 'Medium-High', ''),
      v('H', 'High', ''),
      nd
    ]
  },
  {
    key: 'TD',
    name: 'Target Distribution',
    group: 'environmental',
    about: 'Share of systems that are vulnerable.',
    values: [v('N', 'None', ''), v('L', 'Low', ''), v('M', 'Medium', ''), v('H', 'High', ''), nd]
  },
  ...(['CR', 'IR', 'AR'] as const).map((key) => ({
    key,
    name: `${{ CR: 'Confidentiality', IR: 'Integrity', AR: 'Availability' }[key]} Requirement`,
    group: 'environmental' as const,
    about: 'How much it matters here.',
    values: [v('L', 'Low', ''), v('M', 'Medium', ''), v('H', 'High', ''), nd]
  }))
];

export const metricsFor: Record<Version, Metric[]> = {
  '2.0': metrics2,
  '3.0': metrics3,
  '3.1': metrics3,
  '4.0': metrics4
};

/** values that mean "left out" and never need writing into a vector */
export const isUnset = (value: string | undefined) => !value || value === 'X' || value === 'ND';
