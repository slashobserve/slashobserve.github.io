import type { CorpusEntry } from "../../src/lib/import-corpus"

const COUNT_FIELDS = ["total", "imported", "partial", "placeholder", "unverified"] as const

function count(rel: string, counts: any, field: (typeof COUNT_FIELDS)[number]): number {
  const value = counts?.[field]
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${rel}: report.counts.${field} missing`)
  }
  return value
}

export function summarizeGolden(rel: string, golden: unknown): CorpusEntry {
  const parts = rel.split("/")
  if (parts.length !== 2 || parts.some((part) => part === "") || !parts[1].endsWith(".json")) {
    throw new Error(`${rel}: expected <source>/<file>.json`)
  }
  const [source, file] = parts
  const root = golden as any

  const inputError = root?.input_error
  if (typeof inputError === "string" && inputError !== "") {
    return { source, file, inputError }
  }

  const title = root?.summary?.title
  if (typeof title !== "string") throw new Error(`${rel}: summary.title missing`)

  const counts = root?.report?.counts
  const [total, imported, partial, placeholder, unverified] = COUNT_FIELDS.map((field) =>
    count(rel, counts, field),
  )
  if (unverified !== 0) {
    throw new Error(
      `${rel}: unverified is ${unverified}; the corpus never runs queries, so the site cannot label these panels`,
    )
  }
  if (imported + partial + placeholder + unverified !== total) {
    throw new Error(`${rel}: counts do not add up to total`)
  }
  return { source, file, title, panels: total, imported, partial, placeholders: placeholder }
}
