import { describe, expect, test } from "bun:test"
import { codeFigure } from "./code-figure"

type PreNode = { type: "element"; tagName: "pre"; properties: Record<string, unknown>; children: [] }

function run(lang: string) {
  const pre: PreNode = { type: "element", tagName: "pre", properties: {}, children: [] }
  const ctx = {
    options: { lang },
    addClassToHast(node: PreNode, name: string) {
      node.properties.class = [node.properties.class, name].filter(Boolean).join(" ")
    },
  }
  const figure = (codeFigure.pre as (this: unknown, node: unknown) => unknown).call(ctx, pre)
  return { pre, figure }
}

describe("codeFigure", () => {
  test("wraps the pre in a figure carrying the language", () => {
    const { pre, figure } = run("sh")
    expect(figure).toEqual({
      type: "element",
      tagName: "figure",
      properties: { class: "nb-code-figure", "data-nb-lang": "sh" },
      children: [pre],
    })
  })

  test("marks the pre with astro-code and the language", () => {
    const { pre } = run("yaml")
    expect(pre.properties.class).toBe("astro-code")
    expect(pre.properties["data-nb-lang"]).toBe("yaml")
  })

  test("falls back to text when there is no language", () => {
    const { pre, figure } = run("")
    expect(pre.properties["data-nb-lang"]).toBe("text")
    expect((figure as { properties: Record<string, string> }).properties["data-nb-lang"]).toBe("text")
  })
})
