import { describe, expect, test } from "bun:test"
import { cleanImportPercent, type CorpusEntry } from "./import-corpus"

function dashboard(source: string, file: string, partial = 0, placeholders = 0): CorpusEntry {
  return { source, file, title: file, panels: 10, imported: 10 - partial - placeholders, partial, placeholders }
}

function rejected(source: string, file: string): CorpusEntry {
  return { source, file, inputError: "unexpected end of JSON input" }
}

describe("cleanImportPercent", () => {
  test.each<[string, CorpusEntry[], number | null]>([
    ["is null with no entries", [], null],
    ["is null with only the project's own dashboards", [dashboard("slashobserve", "demo.json")], null],
    ["is 100 when every public dashboard imports clean", [dashboard("rfmoz", "a.json"), dashboard("dotdc", "b.json")], 100],
    ["does not count a dashboard that failed to parse", [dashboard("rfmoz", "a.json"), rejected("rfmoz", "b.json")], 50],
    ["does not count a dashboard with a partial panel", [dashboard("rfmoz", "a.json"), dashboard("rfmoz", "b.json", 1)], 50],
    ["does not count a dashboard with a placeholder panel", [dashboard("rfmoz", "a.json"), dashboard("rfmoz", "b.json", 0, 1)], 50],
    [
      "rounds 2 clean of 3 down to 66",
      [dashboard("rfmoz", "a.json"), dashboard("dotdc", "b.json"), dashboard("dotdc", "c.json", 2)],
      66,
    ],
    [
      "leaves the project's own dashboards out of both counts",
      [dashboard("rfmoz", "a.json"), dashboard("slashobserve", "x.json", 3), rejected("slashobserve", "y.json")],
      100,
    ],
  ])("%s", (_, entries, expected) => {
    expect(cleanImportPercent(entries)).toBe(expected)
  })
})
