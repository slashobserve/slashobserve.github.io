import { describe, expect, test } from "bun:test"
import { siteVersion } from "./site-version"

const fullSha = "15064fbaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa"

describe("siteVersion", () => {
  test("reads the short sha with trailing newlines", () => {
    expect(siteVersion({ sha: "15064fb\n", shallow: "false\n" })).toEqual({ sha: "15064fb" })
  })

  test("falls back to GITHUB_SHA when the short sha cannot be read", () => {
    expect(siteVersion({ sha: null, shallow: "false\n", githubSha: fullSha })).toEqual({ sha: "15064fb" })
  })

  test.each([
    ["a shallow clone", { sha: "15064fb\n", shallow: "true\n", githubSha: fullSha }],
    ["no sha at all", { sha: null, shallow: "false" }],
    ["a malformed sha and GITHUB_SHA", { sha: "HEAD", shallow: "false", githubSha: "abc" }],
  ])("is null for %s", (_, readings) => {
    expect(siteVersion(readings)).toBeNull()
  })
})
