/**
 * Fuzzy string matching and text normalization utility for Aadhaar OCR matching
 * Implements Token Sort Ratio logic (safeguards against minor Indian name variations)
 */

export function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/shri|smt|mr|mrs|ms|kumar|kumari/gi, '') // remove common honorifics for cleaner match
    .replace(/[^a-z0-9\s]/g, '')
    .trim();
}

/**
 * Calculates token sort ratio between two strings (0 - 100%)
 * Emulates fuzzywuzzy.fuzz.token_sort_ratio in TypeScript
 */
export function calculateTokenSortRatio(str1: string, str2: string): number {
  const norm1 = normalizeName(str1);
  const norm2 = normalizeName(str2);

  if (!norm1 || !norm2) return 0;
  if (norm1 === norm2) return 100;

  const tokens1 = norm1.split(/\s+/).filter(Boolean).sort();
  const tokens2 = norm2.split(/\s+/).filter(Boolean).sort();

  const sorted1 = tokens1.join(' ');
  const sorted2 = tokens2.join(' ');

  if (sorted1 === sorted2) return 100;

  // Levenshtein distance on sorted token strings
  const dist = levenshteinDistance(sorted1, sorted2);
  const maxLen = Math.max(sorted1.length, sorted2.length);
  if (maxLen === 0) return 100;

  const ratio = Math.round((1 - dist / maxLen) * 100);
  return Math.max(0, Math.min(100, ratio));
}

function levenshteinDistance(s1: string, s2: string): number {
  const m = s1.length;
  const n = s2.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1, // deletion
        dp[i][j - 1] + 1, // insertion
        dp[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return dp[m][n];
}
