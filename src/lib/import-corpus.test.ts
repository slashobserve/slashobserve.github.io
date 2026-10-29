import { describe, expect, test } from "bun:test"
import { corpusTable, type CorpusEntry } from "./import-corpus"

function dashboard(
  source: string,
  file: string,
  panels: number,
  imported: number,
  partial: number,
  placeholders: number,
): CorpusEntry {
  return { source, file, title: file, panels, imported, partial, placeholders }
}

describe("corpusTable rows", () => {
  test("sums counts per row", () => {
    const { rows } = corpusTable([
      dashboard("kube-prometheus", "a.json", 10, 4, 5, 1),
      dashboard("kube-prometheus", "b.json", 20, 8, 10, 2),
    ])
    expect(rows).toEqual([
      {
        label: "kube-prometheus mixins",
        source: "kube-prometheus",
        dashboards: 2,
        rejected: 0,
        panels: 30,
        imported: 12,
        partial: 15,
        placeholders: 3,
      },
    ])
  })

  test("keeps similarly named files out of the single-file and prefix rows", () => {
    const { rows } = corpusTable([
      dashboard("rfmoz", "node-exporter-full.json", 125, 11, 114, 0),
      dashboard("rfmoz", "node-exporter-full-old.json", 50, 50, 0, 0),
      dashboard("dotdc", "k8s-views-global.json", 30, 3, 27, 0),
      dashboard("dotdc", "k8s-system-coredns.json", 40, 4, 36, 0),
    ])
    expect(rows.map((row) => [row.label, row.dashboards, row.panels])).toEqual([
      ["Node Exporter Full", 1, 125],
      ["Kubernetes views", 1, 30],
    ])
  })

  test("merges altinity and clickhouse-datasource into one row", () => {
    const { rows } = corpusTable([
      dashboard("altinity", "a.json", 10, 5, 3, 2),
      dashboard("clickhouse-datasource", "b.json", 6, 2, 4, 0),
    ])
    expect(rows).toHaveLength(1)
    expect(rows[0]).toMatchObject({
      label: "ClickHouse dashboards",
      dashboards: 2,
      panels: 16,
      imported: 7,
      partial: 7,
      placeholders: 2,
    })
  })

  test("counts a rejected file as a dashboard and a rejection but adds no panels", () => {
    const { rows } = corpusTable([
      dashboard("altinity", "a.json", 10, 5, 3, 2),
      { source: "altinity", file: "bad.json", inputError: "not_json" },
    ])
    expect(rows[0]).toMatchObject({
      dashboards: 2,
      rejected: 1,
      panels: 10,
      imported: 5,
      partial: 3,
      placeholders: 2,
    })
  })

  test("omits a row that matches no entry", () => {
    const { rows } = corpusTable([dashboard("dotdc", "k8s-views-global.json", 1, 1, 0, 0)])
    expect(rows.map((row) => row.label)).toEqual(["Kubernetes views"])
  })
})

describe("corpusTable total", () => {
  test("labels the total with the number of public dashboards", () => {
    const { total } = corpusTable([
      dashboard("rfmoz", "node-exporter-full.json", 125, 11, 114, 0),
      dashboard("altinity", "a.json", 10, 5, 3, 2),
      dashboard("some-new-source", "c.json", 4, 4, 0, 0),
    ])
    expect(total).toMatchObject({
      label: "All 3 public dashboards",
      source: "",
      dashboards: 3,
      panels: 139,
      imported: 20,
      partial: 117,
      placeholders: 2,
    })
  })

  test("leaves the importer's own test dashboards out of rows and total", () => {
    const { rows, total } = corpusTable([
      dashboard("slashobserve", "mine.json", 99, 99, 0, 0),
      dashboard("dotdc", "k8s-views-global.json", 2, 1, 1, 0),
    ])
    expect(rows).toHaveLength(1)
    expect(total).toMatchObject({ label: "All 1 public dashboards", panels: 2 })
  })

  test("is null for an empty corpus or one with only the importer's own dashboards", () => {
    expect(corpusTable([]).total).toBeNull()
    expect(corpusTable([dashboard("slashobserve", "mine.json", 1, 1, 0, 0)]).total).toBeNull()
  })

  test("counts rejected public files in the total", () => {
    const { total } = corpusTable([
      dashboard("dotdc", "k8s-views-global.json", 2, 1, 1, 0),
      { source: "dotdc", file: "bad.json", inputError: "not_json" },
    ])
    expect(total).toMatchObject({ dashboards: 2, rejected: 1, panels: 2 })
  })
})
