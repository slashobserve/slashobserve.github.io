import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type CorpusCounts = {
  panels: number
  imported: number
  partial: number
  placeholders: number
}

export type CorpusEntry =
  | ({ source: string; file: string; title: string } & CorpusCounts)
  | { source: string; file: string; inputError: string }

export type CorpusDashboard = {
  title: string
  source: string
  file: string
} & CorpusCounts

export type CorpusRow = {
  label: string
  source: string
  dashboards: number
  rejected: number
  listed: CorpusDashboard[]
} & CorpusCounts

type EntryKey = { source: string; file: string }

export const CORPUS_PATH = "src/generated/import-corpus.json"
export const OWN_SOURCE = "slashobserve"
export const OTHER_ROW_LABEL = "Other public dashboards"

export const CORPUS_ROWS: readonly {
  label: string
  source: string
  includes: (entry: EntryKey) => boolean
}[] = [
  {
    label: "Node Exporter Full",
    source: "rfmoz",
    includes: (entry) => entry.source === "rfmoz" && entry.file === "node-exporter-full.json",
  },
  {
    label: "Kubernetes views",
    source: "dotdc",
    includes: (entry) => entry.source === "dotdc" && entry.file.startsWith("k8s-views-"),
  },
  {
    label: "kube-prometheus mixins",
    source: "kube-prometheus",
    includes: (entry) => entry.source === "kube-prometheus",
  },
  {
    label: "ClickHouse dashboards",
    source: "Altinity, ClickHouse",
    includes: (entry) => entry.source === "altinity" || entry.source === "clickhouse-datasource",
  },
]

function sumRow(label: string, source: string, entries: readonly CorpusEntry[]): CorpusRow {
  const row: CorpusRow = {
    label,
    source,
    dashboards: entries.length,
    rejected: 0,
    listed: [],
    panels: 0,
    imported: 0,
    partial: 0,
    placeholders: 0,
  }
  for (const entry of entries) {
    if ("inputError" in entry) {
      row.rejected += 1
      continue
    }
    row.listed.push({
      title: entry.title,
      source: entry.source,
      file: entry.file,
      panels: entry.panels,
      imported: entry.imported,
      partial: entry.partial,
      placeholders: entry.placeholders,
    })
    row.panels += entry.panels
    row.imported += entry.imported
    row.partial += entry.partial
    row.placeholders += entry.placeholders
  }
  row.listed.sort((a, b) => a.title.localeCompare(b.title) || a.file.localeCompare(b.file))
  return row
}

function sourceOf(entries: readonly CorpusEntry[]): string {
  const sources = new Set(entries.map((entry) => entry.source))
  return sources.size === 1 ? [...sources][0] : `${sources.size} sources`
}

export function corpusTable(entries: readonly CorpusEntry[]): {
  rows: CorpusRow[]
  total: CorpusRow | null
} {
  const publicEntries = entries.filter((entry) => entry.source !== OWN_SOURCE)
  const claimed = new Set<CorpusEntry>()
  const rows = CORPUS_ROWS.map((row) => {
    const mine = publicEntries.filter((entry) => !claimed.has(entry) && row.includes(entry))
    mine.forEach((entry) => claimed.add(entry))
    return sumRow(row.label, row.source, mine)
  }).filter((row) => row.dashboards > 0)
  const rest = publicEntries.filter((entry) => !claimed.has(entry))
  if (rest.length > 0) rows.push(sumRow(OTHER_ROW_LABEL, sourceOf(rest), rest))
  const total =
    publicEntries.length === 0
      ? null
      : sumRow(`All ${publicEntries.length} public dashboards`, "", publicEntries)
  return { rows, total }
}

export function readImportCorpus(): CorpusEntry[] {
  const path = join(process.cwd(), CORPUS_PATH)
  if (!existsSync(path)) {
    throw new Error(`${CORPUS_PATH} missing: run bun run sync`)
  }
  return JSON.parse(readFileSync(path, "utf8")).entries
}
