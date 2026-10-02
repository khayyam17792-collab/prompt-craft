const VARIABLE_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*\}\}/g

/** Returns the unique `{{variable_name}}` placeholders in a template, in order of appearance. */
export function extractVariables(template = '') {
  const seen = new Set()
  for (const match of template.matchAll(VARIABLE_RE)) {
    seen.add(match[1])
  }
  return [...seen]
}

/** Replaces placeholders with values; unfilled variables are left as-is. */
export function renderTemplate(template = '', values = {}) {
  return template.replace(VARIABLE_RE, (whole, name) => {
    const value = values[name]
    return value === undefined || value === '' ? whole : String(value)
  })
}

/**
 * Rough GPT-style token estimate (no tokenizer dependency).
 * Counts word-ish chunks and punctuation, then blends with the ~4 chars/token heuristic.
 */
export function estimateTokens(text = '') {
  if (!text.trim()) return 0
  const chunks = text.match(/[A-Za-z0-9]+(?:'[a-z]+)?|[^\sA-Za-z0-9]/g) ?? []
  let wordTokens = 0
  for (const chunk of chunks) {
    wordTokens += /^[A-Za-z0-9]/.test(chunk) ? Math.max(1, Math.ceil(chunk.length / 5)) : 1
  }
  const charTokens = text.length / 4
  return Math.round(wordTokens * 0.6 + charTokens * 0.4)
}

/** Merges saved variable metadata with the variables currently present in the template. */
export function mergeVariableMeta(names, saved = []) {
  const byName = new Map(saved.map((v) => [v.name, v]))
  return names.map((name) => ({
    name,
    description: byName.get(name)?.description ?? '',
    default: byName.get(name)?.default ?? '',
  }))
}
