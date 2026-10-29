import { describe, expect, test } from "bun:test"
import { summarizeGolden } from "./corpus"

function golden(counts: Record<string, unknown>) {
  return { input_error: null, summary: { title: "Node Exporter Full" }, report: { counts } }
}

const counts = { total: 125, imported: 11, partial: 114, placeholder: 0, unverified: 0 }

describe("summarizeGolden", () => {
  test("summarizes a normal golden", () => {
    expect(summarizeGolden("rfmoz/node-exporter-full.json", golden(counts))).toEqual({
      source: "rfmoz",
      file: "node-exporter-full.json",
      title: "Node Exporter Full",
      panels: 125,
      imported: 11,
      partial: 114,
      placeholders: 0,
    })
  })

  test("summarizes an input-error golden", () => {
    expect(summarizeGolden("dotdc/bad.json", { input_error: "not_a_dashboard" })).toEqual({
      source: "dotdc",
      file: "bad.json",
      inputError: "not_a_dashboard",
    })
  })

  test("rejects a golden with a missing count", () => {
    const { partial, ...rest } = counts
    expect(() => summarizeGolden("rfmoz/a.json", golden(rest))).toThrow(
      "rfmoz/a.json: report.counts.partial missing",
    )
  })

  test("rejects a golden without a title", () => {
    expect(() =>
      summarizeGolden("rfmoz/a.json", { input_error: null, report: { counts } }),
    ).toThrow("rfmoz/a.json: summary.title missing")
  })

  test("rejects unverified panels", () => {
    expect(() =>
      summarizeGolden(
        "rfmoz/a.json",
        golden({ total: 125, imported: 11, partial: 112, placeholder: 0, unverified: 2 }),
      ),
    ).toThrow(
      "rfmoz/a.json: unverified is 2; the corpus never runs queries, so the site cannot label these panels",
    )
  })

  test("rejects counts that do not add up", () => {
    expect(() => summarizeGolden("rfmoz/a.json", golden({ ...counts, total: 126 }))).toThrow(
      "rfmoz/a.json: counts do not add up to total",
    )
  })

  test.each(["golden.json", "a/b/c.json", "rfmoz/README.md", "/a.json"])(
    "rejects the path %s",
    (rel) => {
      expect(() => summarizeGolden(rel, golden(counts))).toThrow(
        `${rel}: expected <source>/<file>.json`,
      )
    },
  )
})
