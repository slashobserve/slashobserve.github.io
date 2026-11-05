import { describe, expect, test } from "bun:test"
import { siteVersion } from "./site-version"

const fullSha = "15064fbaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

describe("siteVersion", () => {
  test("reads the commit count and short sha with trailing newlines", () => {
    expect(siteVersion({ count: "103\n", sha: "15064fb\n", shallow: "false\n" })).toEqual({ count: 103, sha: "15064fb" })
  })

  test("falls back to GITHUB_SHA when the short sha cannot be read", () => {
    expect(siteVersion({ count: "103\n", sha: null, shallow: "false\n", githubSha: fullSha })).toEqual({
      count: 103,
      sha: "15064fb",
    })
  })

  test.each([
    ["a shallow clone", { count: "1\n", sha: "15064fb\n", shallow: "true\n", githubSha: fullSha }],
    ["a missing count", { count: null, sha: "15064fb\n", shallow: "false\n" }],
    ["a zero count", { count: "0", sha: "15064fb", shallow: "false" }],
    ["a count that is not a number", { count: "fatal: bad revision", sha: "15064fb", shallow: "false" }],
    ["no sha at all", { count: "103", sha: null, shallow: "false" }],
    ["a malformed sha and GITHUB_SHA", { count: "103", sha: "HEAD", shallow: "false", githubSha: "abc" }],
  ])("is null for %s", (_, readings) => {
    expect(siteVersion(readings)).toBeNull()
  })
})
