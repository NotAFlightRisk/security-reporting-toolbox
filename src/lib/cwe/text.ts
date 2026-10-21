export type Part = { text: string; id?: number };

/** splits prose so every "CWE-123" in it can become a link */
export function linkify(text: string): Part[] {
  const parts: Part[] = [];
  let last = 0;
  for (const match of text.matchAll(/CWE-(\d+)/g)) {
    if (match.index > last) parts.push({ text: text.slice(last, match.index) });
    parts.push({ text: match[0], id: Number(match[1]) });
    last = match.index + match[0].length;
  }
  if (last < text.length) parts.push({ text: text.slice(last) });
  return parts;
}

/** first sentence-ish chunk of a description, for meta tags and search rows */
export function summarise(text: string, max = 160) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return `${cut.slice(0, cut.lastIndexOf(' '))}...`;
}

const usageNotes: Record<string, string> = {
  Allowed: 'Fine to map a vulnerability to',
  'Allowed-with-Review': "Can be used, but check a more specific entry doesn't fit better",
  Discouraged: 'Usually too vague, look for a more specific child',
  Prohibited: "Don't map vulnerabilities to this"
};

export const usageNote = (usage: string) => usageNotes[usage] ?? '';
