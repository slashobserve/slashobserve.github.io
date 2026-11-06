import { describe, expect, test } from "bun:test"
import { commitLine } from "./site-facts"

describe("commitLine", () => {
  test("shows the commit count and short sha", () => {
    expect(commitLine({ version: { sha: "15064fb" } })).toBe("15064fb")
  })

  test("is null when the commit is unknown", () => {
    expect(commitLine({ version: null })).toBeNull()
  })
})
