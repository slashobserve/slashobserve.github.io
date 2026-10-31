import type { CoverageArea } from "../../src/lib/import-coverage"

export type AreaInput = {
  area: string
  catalog: unknown
  gapFiles: readonly string[]
}

type Outcome = "imports" | "noEffect" | "excluded"

type Entry = { id: string; outcome: Outcome }

const OUTCOMES = new Map<string, Outcome>([
  ["convert", "imports"],
  ["convert_noted", "imports"],
  ["cosmetic", "noEffect"],
  ["bookkeeping", "noEffect"],
  ["excluded", "excluded"],
])

function readEntries(area: string, catalog: any): Entry[] {
  if (!Array.isArray(catalog?.entries)) throw new Error(`${area}: catalog.json entries missing`)
  return catalog.entries.map((entry: any, index: number) => {
    if (typeof entry?.id !== "string" || entry.id === "") {
      throw new Error(`${area}: catalog.json entry ${index} has no id`)
    }
    const outcome = entry.expect === undefined ? "imports" : OUTCOMES.get(entry.expect)
    if (outcome === undefined) {
      throw new Error(`${area}: catalog.json entry ${entry.id} has unknown expect ${JSON.stringify(entry.expect)}`)
    }
    return { id: entry.id, outcome }
  })
}

function readVersion(area: string, catalog: any): string {
  const grafana = catalog?.grafana
  if (typeof grafana !== "string" || grafana === "") {
    throw new Error(`${area}: catalog.json grafana missing`)
  }
  return grafana
}

function describeVersions(versions: ReadonlyMap<string, string[]>): string {
  return [...versions]
    .map(([version, areas]) => `${version} (${areas.join(", ")})`)
    .join(" and ")
}

export function summarizeArea(input: AreaInput): { grafana: string; summary: CoverageArea } {
  const grafana = readVersion(input.area, input.catalog)
  const entries = readEntries(input.area, input.catalog)
  const gapNames = new Set(input.gapFiles)
  const gapped = entries.filter((entry) => gapNames.has(entry.id))
  const count = (outcome: Outcome) =>
    entries.filter((entry) => entry.outcome === outcome && !gapNames.has(entry.id)).length
  return {
    grafana,
    summary: {
      area: input.area,
      options: entries.length,
      imports: count("imports"),
      noEffect: count("noEffect"),
      excluded: count("excluded"),
      gaps: gapped.length,
    },
  }
}

export function summarizeConformance(inputs: readonly AreaInput[]): {
  grafana: string
  areas: CoverageArea[]
} {
  if (inputs.length === 0) throw new Error("no conformance areas found")
  const summaries = inputs.map(summarizeArea)

  const versions = new Map<string, string[]>()
  for (const { grafana, summary } of summaries) {
    versions.set(grafana, [...(versions.get(grafana) ?? []), summary.area])
  }
  if (versions.size > 1) {
    throw new Error(
      `conformance catalogs name different Grafana versions: ${describeVersions(versions)}`,
    )
  }

  const areas = summaries
    .map(({ summary }) => summary)
    .sort((a, b) => (a.area < b.area ? -1 : a.area > b.area ? 1 : 0))
  return { grafana: summaries[0].grafana, areas }
}
