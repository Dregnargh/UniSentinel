/**
 * Tiny className joiner. Accepts strings, falsy values, and {class: condition}
 * maps, returning a single space-separated string. Used by every UniSentinel
 * component to compose its `us-*` classes with caller-supplied `className`.
 */
export type ClassValue = string | number | false | null | undefined | Record<string, boolean | null | undefined>;

export function cn(...values: ClassValue[]): string {
  const out: string[] = [];
  for (const v of values) {
    if (!v) continue;
    if (typeof v === 'string' || typeof v === 'number') {
      out.push(String(v));
    } else {
      for (const key in v) {
        if (v[key]) out.push(key);
      }
    }
  }
  return out.join(' ');
}
