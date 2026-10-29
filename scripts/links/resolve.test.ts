/// <reference types="bun" />
import { describe, expect, test } from "bun:test"
import { candidateFiles, resolveHref } from "./resolve"

describe("resolveHref external", () => {
  test.each([
    "mailto:hi@slashobserve.com",
    "tel:+15550100",
    "javascript:void(0)",
    "data:image/png;base64,AAAA",
    "https://github.com/slashobserve/slashobserve",
    "http://slashobserve.com.evil.example/x/",
    "//cdn.example/lib.js",
  ])("classifies %s as external", (href) => {
    expect(resolveHref("index.html", href)).toEqual({ kind: "external" })
  })
})

describe("resolveHref internal", () => {
  const cases: [string, string, string, string | null][] = [
    ["absolute site url", "https://slashobserve.com/docs/", "docs/index.html", null],
    ["root-relative with fragment", "/docs/self-hosting/#mcp", "docs/self-hosting/index.html", "mcp"],
    ["relative parent", "../x/", "docs/x/index.html", null],
    ["query stripped", "/docs/a/?tab=1", "docs/a/index.html", null],
    ["percent-decoded path", "/docs/hello%20world/", "docs/hello world/index.html", null],
    ["percent-decoded fragment", "/docs/a/#caf%C3%A9", "docs/a/index.html", "café"],
    ["extensionless path", "/docs/x", "docs/x", null],
    ["asset", "/_astro/app.abc123.js", "_astro/app.abc123.js", null],
    ["root", "/", "index.html", null],
  ]

  test.each(cases)("%s", (_name, href, file, fragment) => {
    expect(resolveHref("docs/a/index.html", href)).toEqual({ kind: "internal", file, fragment })
  })

  test("fragment-only href stays on the page it appears on", () => {
    expect(resolveHref("docs/self-hosting/index.html", "#quick-start")).toEqual({
      kind: "internal",
      file: "docs/self-hosting/index.html",
      fragment: "quick-start",
    })
  })

  test("empty and bare-hash hrefs point at the same page without a fragment", () => {
    for (const href of ["", "#"]) {
      expect(resolveHref("docs/a/index.html", href)).toEqual({
        kind: "internal",
        file: "docs/a/index.html",
        fragment: null,
      })
    }
  })

  test("relative href from the site root resolves against the root", () => {
    expect(resolveHref("index.html", "docs/")).toEqual({ kind: "internal", file: "docs/index.html", fragment: null })
  })

  test("parent segments cannot escape the site root", () => {
    expect(resolveHref("index.html", "../../etc/")).toEqual({ kind: "internal", file: "etc/index.html", fragment: null })
  })

  test("malformed percent escapes are kept as written", () => {
    expect(resolveHref("index.html", "/100%/")).toEqual({ kind: "internal", file: "100%/index.html", fragment: null })
  })
})

describe("candidateFiles", () => {
  test.each([
    ["/docs/x/", ["docs/x/index.html"]],
    ["/docs/x", ["docs/x", "docs/x.html", "docs/x/index.html"]],
    ["/", ["index.html"]],
    [
      "/schemas/observespec.v0.json",
      ["schemas/observespec.v0.json", "schemas/observespec.v0.json.html", "schemas/observespec.v0.json/index.html"],
    ],
  ])("%s", (path, expected) => {
    expect(candidateFiles(path)).toEqual(expected)
  })
})
