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
  test("counts options, gaps, converts and exclusions per area", () => {
    const result = summarizeConformance([
      input("heatmap", catalog(["a=1", "b=2", "c=3", "d=4"], ["x=1"]), ["b=2", "d=4"]),
    ])
    expect(result).toEqual({
      grafana: "v12.3.0",
      areas: [{ area: "heatmap", options: 4, converts: 2, gaps: 2, excluded: 1 }],
    })
  })

  test("ignores gap files that match no entry id", () => {
    const result = summarizeConformance([
      input("gauge", catalog(["a=1", "b=2"]), ["a=1", ".gitkeep", "stale=9"]),
    ])
    expect(result.areas[0]).toMatchObject({ options: 2, gaps: 1, converts: 1 })
  })

  test("does not count a gap file named after an excluded entry", () => {
    const result = summarizeConformance([input("dashboard", catalog(["a=1"], ["x=1"]), ["x=1"])])
    expect(result.areas[0]).toEqual({
      area: "dashboard",
      options: 1,
      converts: 1,
      gaps: 0,
      excluded: 1,
    })
  })

  test("treats cosmetic, bookkeeping and convert entries as options", () => {
    const result = summarizeConformance([
      input("table", {
        grafana: "v12.3.0",
        entries: [
          { id: "a" },
          { id: "b", expect: "convert" },
          { id: "c", expect: "cosmetic" },
          { id: "d", expect: "bookkeeping" },
        ],
      }),
    ])
    expect(result.areas[0]).toMatchObject({ options: 4, converts: 4, gaps: 0, excluded: 0 })
  })

  test("handles an area with no entries and no gaps", () => {
    const result = summarizeConformance([input("news", { grafana: "v12.3.0", entries: [] })])
    expect(result.areas[0]).toEqual({ area: "news", options: 0, converts: 0, gaps: 0, excluded: 0 })
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
  ])("rejects a catalog with %s", (_name, cat, message) => {
    expect(() => summarizeConformance([input("gauge", cat)])).toThrow(message)
  })
})
