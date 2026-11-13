import { describe, expect, test } from "bun:test"
import { DOC_LINK_CANDIDATES, resolveCandidate, resolveDocLinks } from "./doc-links"

const corePages = new Set([
  "docs/get-started/quick-start",
  "docs/get-started/install",
  "docs/use/import-grafana",
  "docs/use/mcp",
  "docs/use/cli",
  "docs/use/observations",
  "docs/use/agents",
  "docs/use/inbox",
  "docs/concepts/proposals",
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
      cliObservations: "/docs/use/cli/#observations",
      observations: "/docs/use/observations/",
      agents: "/docs/use/agents/",
      proposals: "/docs/concepts/proposals/",
      inbox: "/docs/use/inbox/",
      connectAgent: "/docs/use/mcp/#connect-your-own-agent",
      datasources: "/docs/connect/prometheus/",
      elasticsearch: null,
      opensearch: null,
      switchFromGrafana: null,
      logsAndTraces: null,
    })
  })

  test("links the Elasticsearch and OpenSearch pages when core has them", () => {
    const links = resolveDocLinks(new Set([...corePages, "docs/connect/elasticsearch", "docs/connect/opensearch"]))
    expect(links.elasticsearch).toBe("/docs/connect/elasticsearch/")
    expect(links.opensearch).toBe("/docs/connect/opensearch/")
  })

  test("links the switch from Grafana and logs and traces pages when core has them", () => {
    const links = resolveDocLinks(new Set([...corePages, "docs/use/switch-from-grafana", "docs/use/logs-and-traces"]))
    expect(links.switchFromGrafana).toBe("/docs/use/switch-from-grafana/")
    expect(links.logsAndTraces).toBe("/docs/use/logs-and-traces/")
  })

  test("returns null for a page that is not in core", () => {
    const withoutRoles = new Set([...corePages].filter((id) => id !== "docs/teams/roles"))
    const links = resolveDocLinks(withoutRoles)
    expect(links.roles).toBeNull()
    expect(links.folders).toBe("/docs/teams/folders/")
  })

  test("returns null for the observation and agent pages until core has them", () => {
    const bare = new Set(["docs/use/mcp", "docs/use/cli"])
    const links = resolveDocLinks(bare)
    expect(links.observations).toBeNull()
    expect(links.agents).toBeNull()
    expect(links.proposals).toBeNull()
    expect(links.inbox).toBeNull()
    expect(links.connectAgent).toBe("/docs/use/mcp/#connect-your-own-agent")
    expect(links.cliObservations).toBe("/docs/use/cli/#observations")
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

describe("resolveCandidate", () => {
  const ids = new Set(["docs/use/mcp"])

  test.each([
    ["docs/use/mcp", "/docs/use/mcp/"],
    ["docs/use/mcp#tools", "/docs/use/mcp/#tools"],
    ["docs/use/cli", null],
  ])("resolves %s", (candidate, href) => {
    expect(resolveCandidate(candidate, ids)).toBe(href)
  })
})
