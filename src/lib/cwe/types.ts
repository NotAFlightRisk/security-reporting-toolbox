/** a paragraph, or a list of items */
export type Block = string | string[];

export type Usage = 'Allowed' | 'Allowed-with-Review' | 'Discouraged' | 'Prohibited';

export interface Mapping {
  usage: Usage;
  rationale: string;
  comments: string;
  reasons: string[];
  suggestions: { id: number; comment: string }[];
}

export interface Weakness {
  id: number;
  name: string;
  abstraction: 'Pillar' | 'Class' | 'Base' | 'Variant' | 'Compound';
  status: string;
  description: string;
  extended: Block[];
  terms: { term: string; description: string }[];
  likelihood: string;
  consequences: { scopes: string[]; impacts: string[]; note: string }[];
  introduced: { phase: string; note: string }[];
  platforms: { type: string; name: string; prevalence: string }[];
  mitigations: {
    phases: string[];
    strategy: string;
    description: Block[];
    effectiveness: string;
  }[];
  related: { nature: string; id: number; view: string }[];
  children: number[];
  examples: { ref: string; description: string }[];
  mapping: Mapping | null;
}

export interface Category {
  id: number;
  name: string;
  status: string;
  summary: Block[];
  members: number[];
  mapping: Mapping | null;
}

export interface View {
  id: number;
  label: string;
  name: string;
  objective: string;
  columns: { id: number; name: string; members: number[] }[];
}

export interface Catalogue {
  version: string;
  date: string;
  weaknesses: Weakness[];
  categories: Category[];
  views: View[];
  viewNames: Record<string, string>;
}

/** one searchable row, small enough to ship the whole lot to the explorer */
export interface IndexEntry {
  id: number;
  name: string;
  kind: Weakness['abstraction'] | 'Category';
  status: string;
  usage: Usage | '';
  terms: string[];
  summary: string;
}
