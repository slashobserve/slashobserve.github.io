import { describe, expect, test } from "bun:test"
import { versionLine } from "./site-facts"

describe("versionLine", () => {
  test("shows the commit count and short sha", () => {
    expect(versionLine({ version: { count: 103, sha: "15064fb" } })).toBe("site version 103 · 15064fb")
  })

  test("is null when the version is unknown", () => {
    expect(versionLine({ version: null })).toBeNull()
  })
})
