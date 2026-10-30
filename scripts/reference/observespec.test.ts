import { describe, expect, test } from "bun:test"
import { observespecPages, type Example } from "./observespec"

const schema = {
  description: "ObserveSpec v0: one dashboard. Frozen for milestone 1 (Ishan, 2026-10-18).",
  required: ["title"],
  properties: {
    title: { type: "string" },
    panels: { type: "array", maxItems: 5, items: { $ref: "#/$defs/panel" } },
  },
  $defs: {
    panel: { oneOf: [{ $ref: "#/$defs/dataPanel" }, { $ref: "#/$defs/textPanel" }] },
    dataPanel: {
      required: ["id", "type"],
      properties: {
        id: { type: "string", description: "Stable id." },
        type: { enum: ["timeseries", "nodeGraph"] },
        maxPerRow: { type: "integer", minimum: 1, maximum: 200 },
        overrides: { type: "array", items: { $ref: "#/$defs/override" } },
        display: { type: "object" },
        match: { $ref: "#/$defs/match" },
      },
      allOf: [
        { $ref: "#/$defs/fieldProps" },
        {
          if: { properties: { type: { const: "timeseries" } } },
          then: {
            properties: {
              display: {
                type: "object",
                properties: {
                  legend: { enum: ["bottom", "hidden"] },
                  graph: { type: "boolean", description: "Show a graph." },
                },
              },
            },
          },
        },
        {
          if: { properties: { type: { const: "nodeGraph" } } },
          then: { properties: { display: { type: "object", properties: {} } } },
        },
      ],
    },
    textPanel: {
      description: "Static text.",
      required: ["type", "content"],
      properties: {
        type: { const: "text" },
        content: { type: "string", description: "Use <name> or a | b." },
      },
    },
    variable: { oneOf: [{ $ref: "#/$defs/queryVariable" }, { $ref: "#/$defs/customVariable" }] },
    queryVariable: {
      required: ["name", "type"],
      properties: { name: { type: "string" }, type: { const: "query" } },
    },
    customVariable: {
      required: ["type"],
      properties: { type: { const: "custom" }, values: { type: "array" } },
    },
    fieldProps: {
      properties: {
        unit: { type: "string", description: "Unit id." },
        decimals: { type: "integer", minimum: 0, maximum: 10 },
      },
    },
    match: { description: "Which series an override applies to.", type: "object" },
    override: {
      required: ["match"],
      allOf: [{ $ref: "#/$defs/fieldProps" }],
      properties: { match: { $ref: "#/$defs/match" } },
    },
    mapping: {
      description: "Value mapping.",
      oneOf: [
        { properties: { value: { type: "string" }, text: { type: "string" } }, required: ["value"] },
        { properties: { regex: { type: "string" }, text: { type: "string" } }, required: ["regex"] },
      ],
    },
    transform: {
      oneOf: [
        { properties: { type: { const: "merge" } }, required: ["type"] },
        {
          properties: { type: { const: "limit" }, count: { type: "integer", minimum: 1, maximum: 9 } },
          required: ["type", "count"],
        },
      ],
    },
  },
}

const examples: Example[] = [
  {
    file: "b.json",
    spec: {
      variables: [{ type: "query", name: "from_b" }],
      panels: [{ id: "from_b", type: "timeseries" }],
    },
  },
  {
    file: "a.json",
    spec: {
      panels: [{ id: "row", type: "row", panels: [{ id: "child", type: "timeseries" }] }],
    },
  },
]

function without(path: string[]): unknown {
  const copy = structuredClone(schema) as Record<string, unknown>
  const parent = path
    .slice(0, -1)
    .reduce<Record<string, unknown>>((node, key) => node[key] as Record<string, unknown>, copy)
  delete parent[path[path.length - 1] ?? ""]
  return copy
}

const pages = observespecPages(schema, examples, "abc1234")
const find = (path: string) => pages.find((page) => page.path === path)?.markdown ?? ""

describe("observespecPages", () => {
  test("writes every page path with its sidebar order", () => {
    const order = (path: string) => Number(/^order: (\d+)$/m.exec(find(path))?.[1])
    expect(pages.map((page) => page.path)).toEqual([
      "index.md",
      "variables/query.md",
      "variables/custom.md",
      "panels/timeseries.md",
      "panels/nodegraph.md",
      "panels/text.md",
      "field-options.md",
      "overrides-and-mappings.md",
      "transforms.md",
    ])
    expect(pages.map((page) => order(page.path))).toEqual([0, 100, 101, 200, 201, 221, 300, 310, 320])
  })

  test("keeps the type as the title of a camelCase page and lowercases the file name", () => {
    expect(find("panels/nodegraph.md")).toContain('title: "nodeGraph"')
  })

  test("marks required fields and spells enums out", () => {
    const page = find("panels/timeseries.md")
    expect(page).toContain("| `id` (required) | `string` | Stable id. |")
    expect(page).toContain('| `type` (required) | `"timeseries"`, `"nodeGraph"` |')
  })

  test("links a reference that has a page", () => {
    const page = find("panels/timeseries.md")
    expect(page).toContain("array of [`override`](/docs/reference/observespec/overrides-and-mappings/#overrides)")
    expect(page).toContain("Every data panel also takes the [field options](/docs/reference/observespec/field-options/).")
  })

  test("falls back to the referenced definition's description and appends the range", () => {
    const page = find("panels/timeseries.md")
    expect(page).toContain("| `match` | `match` | Which series an override applies to. |")
    expect(page).toContain("| `maxPerRow` | `integer` | Between 1 and 200. |")
  })

  test("writes display options only for a type that has them", () => {
    expect(find("panels/timeseries.md")).toContain(
      ["## Display options", "", "| Field | Values | Description |", "| --- | --- | --- |"].join("\n"),
    )
    expect(find("panels/timeseries.md")).toContain("| `graph` | `true`, `false` | Show a graph. |")
    expect(find("panels/nodegraph.md")).not.toContain("Display options")
    expect(find("panels/nodegraph.md")).toContain("Fields of a `nodeGraph` panel.")
    expect(find("panels/timeseries.md")).not.toContain("| `display` |")
  })

  test("takes the example from the alphabetically first file, including a row child", () => {
    const page = find("panels/timeseries.md")
    expect(page).toContain('"id": "child"')
    expect(page).not.toContain("from_b")
    expect(page).toContain("[`spec/examples/a.json`](https://github.com/slashobserve/slashobserve/blob/main/spec/examples/a.json)")
  })

  test("takes a variable example from the files that have one", () => {
    expect(find("variables/query.md")).toContain('"name": "from_b"')
  })

  test("omits the example section when nothing matches", () => {
    expect(find("variables/custom.md")).not.toContain("## Example")
    expect(find("panels/text.md")).not.toContain("## Example")
  })

  test("uses the definition's description for a non-data panel", () => {
    expect(find("panels/text.md")).toContain('description: "Static text."')
  })

  test("ends every page with the footer carrying the commit", () => {
    for (const page of pages) {
      expect(page.markdown.trimEnd().split("\n").at(-1)).toBe(
        "Generated from [`spec/schema/observespec.v0.json`](https://github.com/slashobserve/slashobserve/blob/abc1234/spec/schema/observespec.v0.json) at `abc1234`. [Report a problem](https://github.com/slashobserve/slashobserve/issues/new).",
      )
    }
  })

  test("drops the milestone sentence from the index description", () => {
    expect(find("index.md")).toContain('description: "ObserveSpec v0: one dashboard."')
    expect(find("index.md")).toContain('navLabel: "Overview"')
    expect(pages.every((page) => !/milestone/i.test(page.markdown))).toBe(true)
  })

  test("escapes angle brackets and pipes in schema text", () => {
    expect(find("panels/text.md")).toContain("Use &lt;name> or a \\| b.")
  })

  test("writes mappings by key and transforms with or without options", () => {
    const mappings = find("overrides-and-mappings.md")
    expect(mappings).toContain("### value")
    expect(mappings).toContain("### regex")
    expect(mappings).toContain("Value mapping.")
    const transforms = find("transforms.md")
    expect(transforms).toContain("## merge\n\nNo options besides `type`.")
    expect(transforms).toContain("| `count` (required) | `integer` | Between 1 and 9. |")
  })

  test("returns identical output for the same input", () => {
    expect(observespecPages(schema, examples, "abc1234")).toEqual(pages)
  })

  const missingPaths: [string[], string][] = [
    [["$defs", "variable"], "$defs.variable.oneOf"],
    [["$defs", "dataPanel", "allOf"], "$defs.dataPanel.allOf"],
    [["$defs", "panel", "oneOf"], "$defs.panel.oneOf"],
    [["$defs", "fieldProps", "properties"], "$defs.fieldProps.properties"],
    [["$defs", "override"], "$defs.override"],
    [["$defs", "mapping", "oneOf"], "$defs.mapping.oneOf"],
    [["$defs", "transform", "oneOf"], "$defs.transform.oneOf"],
  ]
  test.each(missingPaths)("throws when %p is absent", (path, reported) => {
    expect(() => observespecPages(without(path), examples, "abc1234")).toThrow(
      `observespec schema: missing ${reported}`,
    )
  })

  test("throws when a branch has no type constant", () => {
    const broken = structuredClone(schema)
    delete (broken.$defs.queryVariable.properties as Record<string, unknown>).type
    expect(() => observespecPages(broken, examples, "abc1234")).toThrow(
      "observespec schema: missing $defs.variable.oneOf[0].properties.type.const",
    )
  })
})
