const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC'
});

/** "21 Oct 2026" from anything Date can parse, or '' when there's nothing usable */
export function formatDate(value: string | null | undefined) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '' : dateFormat.format(date);
}

/** 0.97482 -> "97.48%" */
export const percent = (value: number, digits = 2) => `${(value * 100).toFixed(digits)}%`;

export const count = (value: number) => value.toLocaleString('en-GB');

export const plural = (value: number, word: string, many = `${word}s`) =>
  `${count(value)} ${value === 1 ? word : many}`;
