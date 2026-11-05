import { describe, expect, test } from "bun:test"
import { mappedPanelTypeCount, type CoverageArea, type ImportCoverage } from "./import-coverage"

function area(id: string, imports: number): CoverageArea {
  return { area: id, options: imports + 2, imports, noEffect: 1, excluded: 0, gaps: 1 }
}

function coverage(areas: CoverageArea[]): ImportCoverage {
  return { core: "abc1234", grafana: "v12.3.0", areas }
}

describe("mappedPanelTypeCount", () => {
  test.each<[string, CoverageArea[], number]>([
    ["counts current and legacy panel types that import options", [area("timeseries", 40), area("graph", 3)], 2],
    ["skips a panel type with no imported option", [area("timeseries", 40), area("alertgroups", 0)], 1],
    ["skips areas that are not panel types", [area("transformations", 30), area("variables-query", 9), area("stat", 5)], 1],
    ["skips an area it does not know", [area("some-new-plugin", 4)], 0],
    ["is 0 with no areas", [], 0],
  ])("%s", (_, areas, expected) => {
    expect(mappedPanelTypeCount(coverage(areas))).toBe(expected)
  })
})
