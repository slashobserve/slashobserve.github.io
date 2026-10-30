import { describe, expect, test } from "bun:test"
import { DOC_LINK_CANDIDATES, resolveDocLinks } from "./doc-links"

const corePages = new Set([
  "docs/get-started/quick-start",
  "docs/get-started/install",
  "docs/use/import-grafana",
  "docs/use/mcp",
  "docs/use/cli",
  "docs/teams/roles",
  "docs/teams/folders",
  "docs/connect/oidc",
  "docs/connect/llm-providers",
  "docs/connect/prometheus",
  "docs/reference/configuration",
])

describe("resolveDocLinks", () => {
  test("links every key to its core page", () => {
    expect(resolveDocLinks(corePages)).toEqual({
      quickStart: "/docs/get-started/quick-start/",
      install: "/docs/get-started/install/",
      importGuide: "/docs/use/import-grafana/",
      mcp: "/docs/use/mcp/",
      selfHost: "/docs/get-started/install/",
      reference: "/docs/reference/configuration/",
      roles: "/docs/teams/roles/",
      folders: "/docs/teams/folders/",
      oidc: "/docs/connect/oidc/",
      llm: "/docs/connect/llm-providers/",
      cli: "/docs/use/cli/",
      datasources: "/docs/connect/prometheus/",
    })
  })

  test("returns null for a page that is not in core", () => {
    const withoutRoles = new Set([...corePages].filter((id) => id !== "docs/teams/roles"))
    const links = resolveDocLinks(withoutRoles)
    expect(links.roles).toBeNull()
    expect(links.folders).toBe("/docs/teams/folders/")
  })

  test("returns null for every key when no docs exist", () => {
    const values = Object.values(resolveDocLinks(new Set()))
    expect(values).toHaveLength(Object.keys(DOC_LINK_CANDIDATES).length)
    expect(values.every((value) => value === null)).toBe(true)
  })

  test("ignores ids that only share a prefix with a candidate", () => {
    expect(resolveDocLinks(new Set(["docs/get-started/install-extra"])).selfHost).toBeNull()
  })

  test("no longer links into the retired single self-hosting page", () => {
    const values = Object.values(resolveDocLinks(new Set(["docs/self-hosting"])))
    expect(values.every((value) => value === null)).toBe(true)
  })
})
