/**
 * Splits pasted text into Steam identifiers: one per line, or separated by spaces, commas or semicolons
 * (SteamID64, STEAM_0:1:123, [U:1:123], profile or vanity URLs). Duplicates are dropped, order is kept.
 */
export function splitIdentifiers(text: string): string[] {
  const seen = new Set<string>();
  const result: string[] = [];
  for (const raw of text.split(/[\s,;]+/)) {
    // Quotes and brackets around a whole token come from spreadsheets and chat; [U:1:n] keeps its brackets.
    const token = raw.replace(/^["'<(]+|["'>),.]+$/g, "").trim();
    if (!token || seen.has(token)) continue;
    seen.add(token);
    result.push(token);
  }
  return result;
}
