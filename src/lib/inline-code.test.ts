import { describe, expect, test } from "bun:test"
import { inlineCodeSegments } from "./inline-code"

describe("inlineCodeSegments", () => {
  test("splits a backtick pair into text, code and text", () => {
    expect(inlineCodeSegments("Every `SLASHOBSERVE_*` variable")).toEqual([
      { code: false, text: "Every " },
      { code: true, text: "SLASHOBSERVE_*" },
      { code: false, text: " variable" },
    ])
  })

  test("keeps text without backticks as one text segment", () => {
    expect(inlineCodeSegments("Plain words")).toEqual([{ code: false, text: "Plain words" }])
  })

  test("keeps an unmatched backtick as literal text", () => {
    expect(inlineCodeSegments("a `b")).toEqual([{ code: false, text: "a `b" }])
  })

  test("drops empty segments at the edges", () => {
    expect(inlineCodeSegments("`a`")).toEqual([{ code: true, text: "a" }])
  })

  test("reads several pairs in order", () => {
    expect(inlineCodeSegments("`a` and `b`").map((segment) => segment.code)).toEqual([true, false, true])
  })

  test("returns nothing for an empty string", () => {
    expect(inlineCodeSegments("")).toEqual([])
  })
})
