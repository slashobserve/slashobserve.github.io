import { describe, expect, test } from "bun:test"
import { summarizeConformance, type AreaInput } from "./conformance"

function catalog(ids: string[], excluded: string[] = [], grafana = "v12.3.0") {
  return {
    grafana,
    entries: [
      ...ids.map((id) => ({ id })),
      ...excluded.map((id) => ({ id, expect: "excluded" })),
    ],
  }
}

function input(area: string, cat: unknown, gapFiles: string[] = []): AreaInput {
  return { area, catalog: cat, gapFiles }
}

describe("summarizeConformance", () => {
  test("counts every outcome and the gaps per area", () => {
    const result = summarizeConformance([
      input(
        "heatmap",
        {
          grafana: "v12.3.0",
          entries: [
            { id: "a" },
            { id: "b", expect: "convert" },
            { id: "c", expect: "convert_noted" },
            { id: "d", expect: "cosmetic" },
            { id: "e", expect: "bookkeeping" },
            { id: "f", expect: "excluded" },
            { id: "g", expect: "excluded" },
          ],
        },
        ["b", "e", "g"],
      ),
    ])
    expect(result).toEqual({
      grafana: "v12.3.0",
      areas: [{ area: "heatmap", options: 7, imports: 2, noEffect: 1, excluded: 1, gaps: 3 }],
    })
  })

  test("ignores gap files that match no entry id", () => {
    const result = summarizeConformance([
      input("gauge", catalog(["a=1", "b=2"]), ["a=1", ".gitkeep", "stale=9"]),
    ])
    expect(result.areas[0]).toMatchObject({ options: 2, imports: 1, gaps: 1 })
  })

  test("counts excluded entries as options", () => {
    const result = summarizeConformance([input("dashboard", catalog(["a=1"], ["x=1", "y=2"]))])
    expect(result.areas[0]).toEqual({
      area: "dashboard",
      options: 3,
      imports: 1,
      noEffect: 0,
      excluded: 2,
      gaps: 0,
    })
  })

  test("takes a gapped excluded entry out of excluded and into gaps", () => {
    const result = summarizeConformance([input("dashboard", catalog(["a=1"], ["x=1"]), ["x=1"])])
    expect(result.areas[0]).toEqual({
      area: "dashboard",
      options: 2,
      imports: 1,
      noEffect: 0,
      excluded: 0,
      gaps: 1,
    })
  })

  test("handles an area with no entries and no gaps", () => {
    const result = summarizeConformance([input("news", { grafana: "v12.3.0", entries: [] })])
    expect(result.areas[0]).toEqual({
      area: "news",
      options: 0,
      imports: 0,
      noEffect: 0,
      excluded: 0,
      gaps: 0,
    })
  })

  test("sorts areas by name", () => {
    const result = summarizeConformance([
      input("timeseries", catalog(["a"])),
      input("barchart", catalog(["a"])),
      input("queries-altinity", catalog(["a"])),
      input("alertlist", catalog(["a"])),
    ])
    expect(result.areas.map((area) => area.area)).toEqual([
      "alertlist",
      "barchart",
      "queries-altinity",
      "timeseries",
    ])
  })
})

describe("summarizeConformance failures", () => {
  test("names the areas when catalogs disagree on the grafana version", () => {
    expect(() =>
      summarizeConformance([
        input("gauge", catalog(["a"])),
        input("stat", catalog(["a"], [], "v12.4.0")),
        input("table", catalog(["a"])),
      ]),
    ).toThrow(
      "conformance catalogs name different Grafana versions: v12.3.0 (gauge, table) and v12.4.0 (stat)",
    )
  })

  test("fails when there are no areas", () => {
    expect(() => summarizeConformance([])).toThrow("no conformance areas found")
  })

  test.each([
    ["no grafana version", { entries: [] }, "gauge: catalog.json grafana missing"],
    ["no entries", { grafana: "v12.3.0" }, "gauge: catalog.json entries missing"],
    [
      "an entry without an id",
      { grafana: "v12.3.0", entries: [{ expect: "convert" }] },
      "gauge: catalog.json entry 0 has no id",
    ],
    [
      "an unknown expect value",
      { grafana: "v12.3.0", entries: [{ id: "a=1" }, { id: "b=2", expect: "skipped" }] },
      'gauge: catalog.json entry b=2 has unknown expect "skipped"',
    ],
    [
      "an expect value named like an object property",
      { grafana: "v12.3.0", entries: [{ id: "a=1", expect: "toString" }] },
      'gauge: catalog.json entry a=1 has unknown expect "toString"',
    ],
  ])("rejects a catalog with %s", (_name, cat, message) => {
    expect(() => summarizeConformance([input("gauge", cat)])).toThrow(message)
  })
})
