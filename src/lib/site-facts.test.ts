import { describe, expect, test } from "bun:test"
import { commitLine, releaseLabel, showsPreReleaseNotice } from "./site-facts"

describe("commitLine", () => {
  test("shows the commit count and short sha", () => {
    expect(commitLine({ version: { sha: "15064fb" }, release: null })).toBe("15064fb")
  })

  test("is null when the commit is unknown", () => {
    expect(commitLine({ version: null, release: null })).toBeNull()
  })
})

describe("releaseLabel", () => {
  test("prefixes the release with v", () => {
    expect(releaseLabel({ version: null, release: "0.1.4" })).toBe("v0.1.4")
  })

  test("is null when the release is unknown", () => {
    expect(releaseLabel({ version: null, release: null })).toBeNull()
  })
})

describe("showsPreReleaseNotice", () => {
  test("shows before 1.0", () => {
    expect(showsPreReleaseNotice({ version: null, release: "0.9.12" })).toBe(true)
  })

  test("shows when the release is unknown", () => {
    expect(showsPreReleaseNotice({ version: null, release: null })).toBe(true)
  })

  test("hides from 1.0 on", () => {
    expect(showsPreReleaseNotice({ version: null, release: "1.0.0" })).toBe(false)
    expect(showsPreReleaseNotice({ version: null, release: "10.0.0" })).toBe(false)
  })
})
