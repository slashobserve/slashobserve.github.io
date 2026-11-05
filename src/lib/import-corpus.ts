import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"
import { percentDown } from "./numbers"

export type CorpusCounts = {
  panels: number
  imported: number
  partial: number
  placeholders: number
}

export type CorpusEntry =
  | ({ source: string; file: string; title: string } & CorpusCounts)
  | { source: string; file: string; inputError: string }

export const CORPUS_PATH = "src/generated/import-corpus.json"
export const OWN_SOURCE = "slashobserve"

function importsClean(entry: CorpusEntry): boolean {
  return !("inputError" in entry) && entry.partial === 0 && entry.placeholders === 0
}

export function cleanImportPercent(entries: readonly CorpusEntry[]): number | null {
  const publicEntries = entries.filter((entry) => entry.source !== OWN_SOURCE)
  if (publicEntries.length === 0) return null
  return percentDown(publicEntries.filter(importsClean).length, publicEntries.length)
}

export function readImportCorpus(): CorpusEntry[] {
  const path = join(process.cwd(), CORPUS_PATH)
  if (!existsSync(path)) {
    throw new Error(`${CORPUS_PATH} missing: run bun run sync`)
  }
  return JSON.parse(readFileSync(path, "utf8")).entries
}
