const stopWords = new Set(['a', 'an', 'the', 'and', 'or', 'to', 'of', 'in', 'for', 'is', 'are', 'with', 'on', 'at', 'by', 'this', 'that', 'from']);
const suffixes = ['ing', 'ed', 'ly', 'es', 's'];

export function tokens(input: string) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length > 2 && !stopWords.has(token))
    .map((token) => {
      const suffix = suffixes.find((item) => token.length > item.length + 3 && token.endsWith(item));
      return suffix ? token.slice(0, -suffix.length) : token;
    });
}

export function normalizeText(input: string) {
  return tokens(input).join(' ');
}

export function overlap(a: string[], b: string[]) {
  if (!a.length || !b.length) return 0;
  const left = new Set(a);
  const right = new Set(b);
  const common = [...left].filter((token) => right.has(token)).length;
  return common / Math.max(left.size, right.size);
}

export function summary(input: string) {
  return input.replace(/\s+/g, ' ').trim().slice(0, 220);
}

export function locationBoost(input: string) {
  return /(hostel|block|building|floor|room|lab|library|mess|gate)\s*[a-z0-9-]*/i.test(input) ? 1 : 0;
}
