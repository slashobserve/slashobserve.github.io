import { describe, expect, test } from "bun:test"
import { tableScroll } from "./table-scroll"

type Visit = (node: unknown, ctx: unknown) => unknown

const visit = (node: unknown) => {
  const visitor = Array.isArray(tableScroll.element) ? tableScroll.element[0] : tableScroll.element
  return (visitor!.visit as Visit)(node, {})
}

const cell = { type: "element", tagName: "td", properties: {}, children: [] }

describe("tableScroll", () => {
  test("wraps a bare table in a scroll container and keeps its children", () => {
    const table = { type: "element", tagName: "table", properties: { id: "t" }, children: [cell] }
    expect(visit(table)).toEqual({
      type: "element",
      tagName: "div",
      properties: { className: ["nb-table-scroll"] },
      children: [{ type: "element", tagName: "table", properties: { id: "t" }, children: [cell] }],
    })
  })

  test.each([
    ["an array class", ["wide"]],
    ["a string class", "wide narrow"],
  ])("leaves a table with %s alone", (_, className) => {
    const table = { type: "element", tagName: "table", properties: { className }, children: [] }
    expect(visit(table)).toBeUndefined()
  })

  test("wraps a table whose class list is empty", () => {
    const table = { type: "element", tagName: "table", properties: { className: [] }, children: [] }
    expect(visit(table)).toBeDefined()
  })

  test("only subscribes to tables", () => {
    const visitor = Array.isArray(tableScroll.element) ? tableScroll.element[0] : tableScroll.element
    expect(visitor!.filter).toEqual(["table"])
  })
})
