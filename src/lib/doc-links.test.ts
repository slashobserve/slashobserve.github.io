import { describe, expect, test } from "bun:test"
import { DOC_LINK_CANDIDATES, resolveDocLinks } from "./doc-links"

const today = new Set(["docs/self-hosting"])
const afterSplit = new Set([
  "docs/self-hosting",
  "docs/get-started/quick-start",
  "docs/get-started/install",
  "docs/use/import-grafana",
  "docs/use/mcp",
  "docs/reference",
  "docs/teams/roles",
  "docs/teams/folders",
  "docs/connect/oidc",
  "docs/connect/llm-providers",
  "docs/use/cli",
  "docs/connect/prometheus",
])

describe("resolveDocLinks", () => {
  test("falls back to headings of the single self-hosting page", () => {
    expect(resolveDocLinks(today)).toEqual({
      quickStart: "/docs/self-hosting/#quick-start",
      install: "/docs/self-hosting/#run-your-own-deployment",
      importGuide: "/docs/self-hosting/#import-grafana-dashboards",
      mcp: "/docs/self-hosting/#mcp",
      selfHost: "/docs/self-hosting/",
      reference: null,
      roles: "/docs/self-hosting/#roles",
      folders: "/docs/self-hosting/#folders-and-access",
      oidc: "/docs/self-hosting/#sign-in-with-oidc",
      llm: "/docs/self-hosting/#llm-providers",
      cli: "/docs/self-hosting/#cli",
      datasources: "/docs/self-hosting/#datasources-file",
    })
  })

  test("prefers the split pages once they exist", () => {
    expect(resolveDocLinks(afterSplit)).toEqual({
      quickStart: "/docs/get-started/quick-start/",
      install: "/docs/get-started/install/",
      importGuide: "/docs/use/import-grafana/",
      mcp: "/docs/use/mcp/",
      selfHost: "/docs/self-hosting/",
      reference: "/docs/reference/",
      roles: "/docs/teams/roles/",
      folders: "/docs/teams/folders/",
      oidc: "/docs/connect/oidc/",
      llm: "/docs/connect/llm-providers/",
      cli: "/docs/use/cli/",
      datasources: "/docs/connect/prometheus/",
    })
  })

  test("returns null for every key when no docs exist", () => {
    const values = Object.values(resolveDocLinks(new Set()))
    expect(values).toHaveLength(Object.keys(DOC_LINK_CANDIDATES).length)
    expect(values.every((value) => value === null)).toBe(true)
  })

  test("ignores ids that only share a prefix with a candidate", () => {
    expect(resolveDocLinks(new Set(["docs/self-hosting-extra"])).selfHost).toBeNull()
  })
})
