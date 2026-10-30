import { existsSync, readFileSync } from "node:fs"
import { join } from "node:path"

export type CoverageCounts = {
  options: number
  converts: number
  gaps: number
  excluded: number
}

export type CoverageArea = { area: string } & CoverageCounts

export type ImportCoverage = {
  core: string
  grafana: string
  areas: CoverageArea[]
}

export type CoverageGroupArea = { id: string; label: string } & CoverageCounts

export type CoverageGroup = { label: string; areas: CoverageGroupArea[] } & CoverageCounts

export type CoverageSummary = {
  version: string
  totals: CoverageCounts & { areas: number }
  groups: CoverageGroup[]
}

export const COVERAGE_PATH = "src/generated/import-coverage.json"

const OTHER_GROUP = "Other"

const GROUPS: readonly { label: string; sorted: boolean; areas: readonly (readonly [string, string])[] }[] = [
  {
    label: "Panel types",
    sorted: true,
    areas: [
      ["timeseries", "Time series"],
      ["barchart", "Bar chart"],
      ["bargauge", "Bar gauge"],
      ["candlestick", "Candlestick"],
      ["canvas", "Canvas"],
      ["dashlist", "Dashboard list"],
      ["flamegraph", "Flame graph"],
      ["gauge", "Gauge"],
      ["geomap", "Geomap"],
      ["heatmap", "Heatmap"],
      ["histogram", "Histogram"],
      ["logs", "Logs"],
      ["news", "News"],
      ["nodegraph", "Node graph"],
      ["piechart", "Pie chart"],
      ["stat", "Stat"],
      ["state-timeline", "State timeline"],
      ["status-history", "Status history"],
      ["table", "Table"],
      ["text", "Text"],
      ["traces", "Traces"],
      ["trend", "Trend"],
      ["xychart", "XY chart"],
      ["alertlist", "Alert list"],
    ],
  },
  {
    label: "Field config and overrides",
    sorted: false,
    areas: [["fieldconfig", "Field config and overrides"]],
  },
  {
    label: "Queries",
    sorted: false,
    areas: [
      ["queries-prometheus", "Prometheus"],
      ["queries-clickhouse", "ClickHouse"],
      ["queries-altinity", "Altinity ClickHouse plugin"],
      ["queries-expressions", "Expressions"],
      ["queries-mixed", "Mixed datasource"],
      ["queries-dashboard", "Dashboard source (another panel's results)"],
    ],
  },
  {
    label: "Variables",
    sorted: false,
    areas: [
      ["variables-query", "Query"],
      ["variables-custom", "Custom"],
      ["variables-constant", "Constant"],
      ["variables-interval", "Interval"],
      ["variables-textbox", "Textbox"],
      ["variables-datasource", "Datasource"],
      ["variables-adhoc", "Ad hoc filters"],
      ["variables-groupby", "Group by"],
    ],
  },
  { label: "Transformations", sorted: false, areas: [["transformations", "Transformations"]] },
  { label: "Dashboard settings", sorted: false, areas: [["dashboard", "Dashboard settings"]] },
]

function sum(areas: readonly CoverageCounts[]): CoverageCounts {
  return areas.reduce<CoverageCounts>(
    (total, area) => ({
      options: total.options + area.options,
      converts: total.converts + area.converts,
      gaps: total.gaps + area.gaps,
      excluded: total.excluded + area.excluded,
    }),
    { options: 0, converts: 0, gaps: 0, excluded: 0 },
  )
}

function groupArea(id: string, label: string, area: CoverageArea): CoverageGroupArea {
  return {
    id,
    label,
    options: area.options,
    converts: area.converts,
    gaps: area.gaps,
    excluded: area.excluded,
  }
}

function group(label: string, areas: CoverageGroupArea[]): CoverageGroup {
  return { label, areas, ...sum(areas) }
}

export function displayVersion(grafana: string): string {
  const match = /^v?(\d+\.\d+)/.exec(grafana)
  return `Grafana ${match ? match[1] : grafana}`
}

export function coverageGroups(coverage: ImportCoverage): CoverageSummary {
  const byId = new Map(coverage.areas.map((area) => [area.area, area]))
  const known = new Set<string>()

  const groups = GROUPS.map((spec) => {
    const areas = spec.areas.flatMap(([id, label]) => {
      const area = byId.get(id)
      if (area === undefined) return []
      known.add(id)
      return [groupArea(id, label, area)]
    })
    if (spec.sorted) areas.sort((a, b) => a.label.localeCompare(b.label))
    return group(spec.label, areas)
  })

  const other = coverage.areas
    .filter((area) => !known.has(area.area))
    .map((area) => groupArea(area.area, area.area, area))
    .sort((a, b) => a.id.localeCompare(b.id))

  const shown = [...groups, group(OTHER_GROUP, other)].filter((entry) => entry.areas.length > 0)

  return {
    version: displayVersion(coverage.grafana),
    totals: { ...sum(coverage.areas), areas: coverage.areas.length },
    groups: shown,
  }
}

export function readImportCoverage(): ImportCoverage {
  const path = join(process.cwd(), COVERAGE_PATH)
  if (!existsSync(path)) {
    throw new Error(`${COVERAGE_PATH} missing: run bun scripts/prebuild.ts`)
  }
  return JSON.parse(readFileSync(path, "utf8"))
}
