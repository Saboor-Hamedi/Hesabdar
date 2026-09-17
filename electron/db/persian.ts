/**
 * Normalize Persian, Dari, and Pashto text for consistent FTS matching.
 *
 * Handles:
 *  - Arabic vs Persian letter variants:  ك→ک,  ي→ی,  ة→ه,  ؤ→و,  إ→ا
 *  - Pashto variants: ګ→گ, ړ→ر, ږ→ژ, ڼ→ن, ۍ→ی
 *  - Arabic-Indic digits ٠١٢… and Extended ۰۱۲… → ASCII 012…
 *  - Removes Arabic diacritics (tashkeel) and tatweel
 *  - Collapses whitespace
 */
export function normalizePersian(input: string): string {
  if (!input) return ''
  return input
    .normalize('NFKC')
    .replace(/[\u064B-\u065F\u0670\u0640]/g, '')   // diacritics + tatweel
    .replace(/[كکڪ]/g, 'ک')
    .replace(/[يیىې��]/g, 'ی')
    .replace(/[ةهۀ]/g, 'ه')
    .replace(/[ؤو]/g, 'و')
    .replace(/[أإآا]/g, 'ا')
    .replace(/[ګگ]/g, 'گ')
    .replace(/[ړر]/g, 'ر')
    .replace(/[ږژ]/g, 'ژ')
    .replace(/[ڼن]/g, 'ن')
    .replace(/[\u06F0-\u06F9]/g, (d) => String(d.charCodeAt(0) - 0x06F0))
    .replace(/[\u0660-\u0669]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase()
}

/**
 * Build a safe FTS5 MATCH query from free user input.
 * Strips FTS operators, appends * for prefix search on the last token.
 */
export function buildFtsQuery(raw: string): string {
  const normalized = normalizePersian(raw)
  if (!normalized) return ''
  const tokens = normalized.split(' ').filter(Boolean)
  return tokens.map((t, i) =>
    i === tokens.length - 1 ? `"${t}"*` : `"${t}"`
  ).join(' ')
}