/** Pure string-similarity filename matching for the blog .md importer — no LLM involved. */

function tokenize(filename: string): Set<string> {
  const base = filename.replace(/\.[a-z0-9]+$/i, "");
  return new Set(
    base
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter(Boolean),
  );
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let intersection = 0;
  for (const token of a) if (b.has(token)) intersection++;
  const union = a.size + b.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

export interface MatchResult {
  candidate: string;
  score: number;
}

/** Returns the closest-matching candidate filename by token overlap, or null below a usable threshold. */
export function findClosestMatch(
  targetFilename: string,
  candidates: string[],
  threshold = 0.2,
): MatchResult | null {
  const targetTokens = tokenize(targetFilename);
  let best: MatchResult | null = null;

  for (const candidate of candidates) {
    const score = jaccard(targetTokens, tokenize(candidate));
    if (!best || score > best.score) best = { candidate, score };
  }

  return best && best.score >= threshold ? best : null;
}
