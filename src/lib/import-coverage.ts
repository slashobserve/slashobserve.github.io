import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type CoverageCounts = {
  options: number
  imports: number
  noEffect: number
  excluded: number
  gaps: number
}

export type CoverageArea = { area: string } & CoverageCounts

export type ImportCoverage = {
  core: string
  grafana: string
  areas: CoverageArea[]
}

export const COVERAGE_PATH = "src/generated/import-coverage.json"

const PANEL_AREAS: ReadonlySet<string> = new Set([
  "timeseries",
  "barchart",
  "bargauge",
  "candlestick",
  "canvas",
  "dashlist",
  "flamegraph",
  "gauge",
  "geomap",
  "heatmap",
  "histogram",
  "logs",
  "news",
  "nodegraph",
  "piechart",
  "stat",
  "state-timeline",
  "status-history",
  "table",
  "text",
  "traces",
  "trend",
  "xychart",
  "alertlist",
  "alertgroups",
  "annolist",
  "datagrid",
  "debug",
  "live",
  "logs-new",
  "logstable",
  "graph",
  "singlestat",
  "grafana-singlestat-panel",
  "table-old",
  "heatmap-legacy",
  "natel-discrete-panel",
  "grafana-worldmap-panel",
])

export function mappedPanelTypeCount(coverage: ImportCoverage): number {
  return coverage.areas.filter((entry) => PANEL_AREAS.has(entry.area) && entry.imports > 0).length
}

export function readImportCoverage(): ImportCoverage {
  const path = join(process.cwd(), COVERAGE_PATH)
  if (!existsSync(path)) {
    throw new Error(`${COVERAGE_PATH} missing: run bun scripts/prebuild.ts`)
  }
  return JSON.parse(readFileSync(path, "utf8"))
}
