import { describe, expect, test } from "bun:test"
import { CORPUS_ROWS, corpusTable, type CorpusEntry } from "./import-corpus"

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
        listed: [
          { title: "a.json", source: "kube-prometheus", file: "a.json", panels: 10, imported: 4, partial: 5, placeholders: 1 },
          { title: "b.json", source: "kube-prometheus", file: "b.json", panels: 20, imported: 8, partial: 10, placeholders: 2 },
        ],
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
      ["Other public dashboards", 2, 90],
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

describe("corpusTable dashboards", () => {
  test("lists a row's dashboards by title and leaves rejected files out", () => {
    const { rows } = corpusTable([
      { ...dashboard("altinity", "z.json", 10, 5, 3, 2), title: "Zebra" },
      { ...dashboard("clickhouse-datasource", "a.json", 6, 2, 4, 0), title: "apple" },
      { source: "altinity", file: "bad.json", inputError: "not_json" },
    ])
    expect(rows[0].listed).toEqual([
      { title: "apple", source: "clickhouse-datasource", file: "a.json", panels: 6, imported: 2, partial: 4, placeholders: 0 },
      { title: "Zebra", source: "altinity", file: "z.json", panels: 10, imported: 5, partial: 3, placeholders: 2 },
    ])
    expect(rows[0].dashboards).toBe(3)
    expect(rows[0].rejected).toBe(1)
  })

  test("orders dashboards with the same title by file", () => {
    const { rows } = corpusTable([
      { ...dashboard("kube-prometheus", "b.json", 1, 1, 0, 0), title: "Same" },
      { ...dashboard("kube-prometheus", "a.json", 1, 1, 0, 0), title: "Same" },
    ])
    expect(rows[0].listed.map((item) => item.file)).toEqual(["a.json", "b.json"])
  })
})

describe("corpusTable other public dashboards", () => {
  test("collects public entries no named row includes, counting their sources", () => {
    const { rows } = corpusTable([
      dashboard("rfmoz", "node-exporter-full.json", 125, 11, 114, 0),
      dashboard("cilium", "agent.json", 10, 8, 2, 0),
      dashboard("thanos", "query.json", 20, 15, 4, 1),
      dashboard("cilium", "operator.json", 5, 5, 0, 0),
    ])
    expect(rows.map((row) => row.label)).toEqual(["Node Exporter Full", "Other public dashboards"])
    expect(rows[1]).toMatchObject({
      source: "2 sources",
      dashboards: 3,
      panels: 35,
      imported: 28,
      partial: 6,
      placeholders: 1,
    })
    expect(rows[1].listed.map((item) => item.file)).toEqual(["agent.json", "operator.json", "query.json"])
  })

  test("names the source when the other entries share one", () => {
    const { rows } = corpusTable([
      dashboard("cilium", "agent.json", 10, 8, 2, 0),
      dashboard("cilium", "operator.json", 5, 5, 0, 0),
    ])
    expect(rows[0]).toMatchObject({ label: "Other public dashboards", source: "cilium" })
  })

  test("has no such row when every public entry belongs to a named row", () => {
    const { rows } = corpusTable([dashboard("kube-prometheus", "a.json", 1, 1, 0, 0)])
    expect(rows.map((row) => row.label)).toEqual(["kube-prometheus mixins"])
  })

  test("never includes the importer's own dashboards", () => {
    const { rows } = corpusTable([dashboard("slashobserve", "mine.json", 9, 9, 0, 0)])
    expect(rows).toEqual([])
  })

  test("lists every public dashboard exactly once across the rows, none matching two named rows", () => {
    const entries = [
      dashboard("rfmoz", "node-exporter-full.json", 1, 1, 0, 0),
      dashboard("rfmoz", "haproxy.json", 1, 1, 0, 0),
      dashboard("dotdc", "k8s-views-pods.json", 1, 1, 0, 0),
      dashboard("dotdc", "k8s-system-coredns.json", 1, 1, 0, 0),
      dashboard("kube-prometheus", "a.json", 1, 1, 0, 0),
      dashboard("altinity", "b.json", 1, 1, 0, 0),
      dashboard("clickhouse-datasource", "c.json", 1, 1, 0, 0),
      dashboard("istio", "d.json", 1, 1, 0, 0),
      dashboard("slashobserve", "mine.json", 1, 1, 0, 0),
    ]
    for (const entry of entries) {
      expect(CORPUS_ROWS.filter((row) => row.includes(entry)).length).toBeLessThanOrEqual(1)
    }
    const { rows, total } = corpusTable(entries)
    const listed = rows.flatMap((row) => row.listed.map((item) => `${item.source}/${item.file}`))
    expect(listed.sort()).toEqual(
      entries
        .filter((entry) => entry.source !== "slashobserve")
        .map((entry) => `${entry.source}/${entry.file}`)
        .sort(),
    )
    expect(total?.listed).toHaveLength(8)
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
    expect(total?.listed.map((item) => item.file)).toEqual([
      "a.json",
      "c.json",
      "node-exporter-full.json",
    ])
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

  test("counts rejected public files in the total but does not list them", () => {
    const { total } = corpusTable([
      dashboard("dotdc", "k8s-views-global.json", 2, 1, 1, 0),
      { source: "dotdc", file: "bad.json", inputError: "not_json" },
    ])
    expect(total).toMatchObject({ dashboards: 2, rejected: 1, panels: 2 })
    expect(total?.listed).toHaveLength(1)
  })
})
