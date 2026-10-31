import { describe, expect, test } from "bun:test"
import { coverageGroups, displayVersion, type CoverageArea, type ImportCoverage } from "./import-coverage"

function area(id: string, imports: number, noEffect = 0, excluded = 0, gaps = 0): CoverageArea {
  return { area: id, options: imports + noEffect + excluded + gaps, imports, noEffect, excluded, gaps }
}

function coverage(areas: CoverageArea[], grafana = "v12.3.0"): ImportCoverage {
  return { core: "abc1234", grafana, areas }
}

describe("coverageGroups grouping", () => {
  const { groups } = coverageGroups(
    coverage([
      area("variables-query", 9, 0, 0, 1),
      area("transformations", 30, 0, 0, 10),
      area("timeseries", 50, 10, 0, 40),
      area("dashboard", 20),
      area("barchart", 30, 5, 5, 10),
      area("queries-prometheus", 8),
      area("fieldconfig", 12, 0, 0, 18),
      area("variables-adhoc", 1, 0, 0, 4),
    ]),
  )

  test("orders groups as the page shows them and drops empty ones", () => {
    expect(groups.map((entry) => entry.label)).toEqual([
      "Panel types",
      "Field config and overrides",
      "Queries",
      "Variables",
      "Transformations",
      "Dashboard settings",
    ])
  })

  test("sorts panel types by label and keeps the other groups in map order", () => {
    expect(groups[0].areas.map((entry) => entry.label)).toEqual(["Bar chart", "Time series"])
    expect(groups[3].areas.map((entry) => entry.label)).toEqual(["Query", "Ad hoc filters"])
  })

  test("sums the counts of a group's areas", () => {
    expect(groups[0]).toEqual({
      label: "Panel types",
      areas: expect.any(Array),
      options: 150,
      imports: 80,
      noEffect: 15,
      excluded: 5,
      gaps: 50,
    })
    expect(groups[3]).toMatchObject({ options: 15, imports: 10, noEffect: 0, excluded: 0, gaps: 5 })
  })

  test("carries each area's id and counts", () => {
    expect(groups[1].areas).toEqual([
      {
        id: "fieldconfig",
        label: "Field config and overrides",
        options: 30,
        imports: 12,
        noEffect: 0,
        excluded: 0,
        gaps: 18,
      },
    ])
  })
})

describe("coverageGroups unknown areas", () => {
  test("puts an area outside the map in a trailing Other group labelled by its id", () => {
    const { groups } = coverageGroups(
      coverage([area("zeta-panel", 1, 0, 0, 3), area("timeseries", 5, 0, 0, 5), area("alpha-panel", 6)]),
    )
    expect(groups.map((entry) => entry.label)).toEqual(["Panel types", "Other"])
    expect(groups[1].areas.map((entry) => [entry.id, entry.label])).toEqual([
      ["alpha-panel", "alpha-panel"],
      ["zeta-panel", "zeta-panel"],
    ])
    expect(groups[1]).toMatchObject({ options: 10, imports: 7, gaps: 3 })
  })

  test("has no Other group when every area is mapped", () => {
    const { groups } = coverageGroups(coverage([area("timeseries", 5, 0, 0, 5)]))
    expect(groups.map((entry) => entry.label)).toEqual(["Panel types"])
  })
})

describe("coverageGroups totals", () => {
  test("sums every area, including unknown ones, and counts the areas", () => {
    const { totals } = coverageGroups(
      coverage([area("timeseries", 50, 10, 2, 38), area("dashboard", 20, 0, 1), area("new-area", 4, 0, 0, 6)]),
    )
    expect(totals).toEqual({ options: 131, imports: 74, noEffect: 10, excluded: 3, gaps: 44, areas: 3 })
  })

  test("is all zero for no areas", () => {
    const { totals, groups } = coverageGroups(coverage([]))
    expect(totals).toEqual({ options: 0, imports: 0, noEffect: 0, excluded: 0, gaps: 0, areas: 0 })
    expect(groups).toEqual([])
  })
})

describe("displayVersion", () => {
  test.each([
    ["v12.3.0", "Grafana 12.3"],
    ["v13.0.1", "Grafana 13.0"],
    ["12.3.0", "Grafana 12.3"],
    ["nightly", "Grafana nightly"],
  ])("formats %s as %s", (raw, expected) => {
    expect(displayVersion(raw)).toBe(expected)
  })

  test("is the version in the summary", () => {
    expect(coverageGroups(coverage([], "v12.3.0")).version).toBe("Grafana 12.3")
  })
})
