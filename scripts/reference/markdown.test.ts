import { describe, expect, test } from "bun:test"
import {
  assertSiteSafe,
  cell,
  code,
  constraintNote,
  escapeText,
  frontMatter,
  table,
  typeLabel,
  withoutMilestones,
} from "./markdown"

const refName = (ref: string) => `<${ref.slice(ref.lastIndexOf("/") + 1)}>`

describe("frontMatter", () => {
  test("writes keys in a fixed order with quoted strings", () => {
    expect(
      frontMatter({
        title: 'A "quoted": title',
        description: "Plain.",
        navLabel: "Short",
        order: 3,
        generatedFrom: "spec/schema/x.json",
      }),
    ).toBe(
      [
        "---",
        'title: "A \\"quoted\\": title"',
        'description: "Plain."',
        'navLabel: "Short"',
        "order: 3",
        'generatedFrom: "spec/schema/x.json"',
        "---",
        "",
        "",
      ].join("\n"),
    )
  })

  test("omits navLabel when unset", () => {
    const text = frontMatter({ title: "T", description: "D", order: 0, generatedFrom: "f" })
    expect(text).not.toContain("navLabel")
  })
})

describe("escapeText", () => {
  test("escapes an angle bracket outside code spans only", () => {
    expect(escapeText("a <uuid> and `<uuid>` and ``<x>``")).toBe("a &lt;uuid> and `<uuid>` and ``<x>``")
  })
})

describe("cell", () => {
  test("escapes pipes, flattens newlines and trims", () => {
    expect(cell("  a | b\nc  \n\n d `x|y` ")).toBe("a \\| b c d `x\\|y`")
  })
})

describe("table", () => {
  test("writes a header, a separator and one line per row", () => {
    expect(
      table(
        ["Field", "Type"],
        [
          ["`a`", "`string`"],
          ["`b`", ""],
        ],
      ),
    ).toBe(["| Field | Type |", "| --- | --- |", "| `a` | `string` |", "| `b` |   |"].join("\n"))
  })
})

describe("code", () => {
  test("wraps in single backticks, or double when the text has one", () => {
    expect(code("a")).toBe("`a`")
    expect(code("a`b")).toBe("`` a`b ``")
  })
})

describe("withoutMilestones", () => {
  test("drops the sentence that names a milestone", () => {
    expect(
      withoutMilestones(
        "ObserveSpec v0: one SlashObserve dashboard. Absent fields mean the default. Frozen for milestone 1 (Ishan, 2026-10-18).",
      ),
    ).toBe("ObserveSpec v0: one SlashObserve dashboard. Absent fields mean the default.")
  })
})

describe("assertSiteSafe", () => {
  test("throws for a milestone mention and passes otherwise", () => {
    expect(() => assertSiteSafe({ path: "a.md", markdown: "Shipped in Milestone 2." })).toThrow(
      "a.md: generated text mentions a milestone",
    )
    expect(() => assertSiteSafe({ path: "a.md", markdown: "Nothing here." })).not.toThrow()
  })
})

describe("typeLabel", () => {
  const cases: [string, unknown, string][] = [
    ["a ref", { $ref: "#/$defs/color" }, "<color>"],
    ["a const", { const: "row" }, '`"row"`'],
    ["an enum", { enum: ["h", "v"] }, '`"h"`, `"v"`'],
    ["an array of refs", { type: "array", items: { $ref: "#/$defs/link" } }, "array of <link>"],
    ["an array without items", { type: "array" }, "array of any"],
    ["a oneOf", { oneOf: [{ type: "string" }, { $ref: "#/$defs/n" }] }, "`string` or <n>"],
    ["an anyOf", { anyOf: [{ type: "number" }, { type: "boolean" }] }, "`number` or `boolean`"],
    ["a type list", { type: ["string", "null"] }, "`string` or `null`"],
    ["an object", { type: "object", properties: {} }, "`object`"],
    ["a plain type with a format", { type: "string", format: "date-time" }, "`string` (date-time)"],
    ["a nullable type", { type: "string", nullable: true }, "`string` or `null`"],
    ["an empty node", {}, "any"],
    ["a non-node", null, "any"],
  ]
  test.each(cases)("renders %s", (_name, node, expected) => {
    expect(typeLabel(node, refName)).toBe(expected)
  })
})

describe("constraintNote", () => {
  const cases: [string, unknown, string][] = [
    ["a range", { type: "integer", minimum: 1, maximum: 200 }, "Between 1 and 200."],
    ["only a minimum", { type: "integer", minimum: 1 }, ""],
    ["max items", { type: "array", maxItems: 20 }, "At most 20 items."],
    ["max items on a non-array", { type: "string", maxItems: 20 }, ""],
    ["a default", { type: "string", default: "auto" }, 'Default `"auto"`.'],
    ["several", { type: "array", maxItems: 2, default: [] }, "At most 2 items. Default `[]`."],
    ["none", { type: "string" }, ""],
    ["a non-node", "x", ""],
  ]
  test.each(cases)("notes %s", (_name, node, expected) => {
    expect(constraintNote(node)).toBe(expected)
  })
})
