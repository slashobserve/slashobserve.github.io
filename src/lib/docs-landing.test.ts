import { describe, expect, test } from "bun:test"
import { REFERENCE_GROUP, TOPIC_GROUPS, resolveGroups } from "./docs-landing"

const pinnedDocs = new Set(
  [
    "concepts/agent",
    "concepts/datasources-and-variables",
    "concepts/observespec",
    "concepts/versions",
    "connect/clickhouse",
    "connect/llm-providers",
    "connect/oidc",
    "connect/prometheus",
    "get-started/first-dashboard",
    "get-started/install",
    "get-started/known-limitations",
    "get-started/quick-start",
    "get-started/what-is-slashobserve",
    "operate/logging",
    "operate/outbound-access",
    "operate/production",
    "operate/security-model",
    "operate/service-account-keys",
    "operate/upgrades-and-backups",
    "reference/configuration",
    "reference/datasources-file",
    "reference/api",
    "reference/observespec",
    "teams/folders",
    "teams/roles",
    "teams/saved-prompts",
    "use/chat",
    "use/cli",
    "use/edit-panel",
    "use/import-grafana",
    "use/mcp",
    "use/review",
  ].map((id) => `docs/${id}`),
)

function group(title: string, links: { label: string; candidates: string[] }[]) {
  return { title, links }
}

describe("resolveGroups", () => {
  test("passes an external candidate through unchanged", () => {
    const groups = resolveGroups(
      [group("Reference", [{ label: "Release notes", candidates: ["https://github.com/slashobserve/slashobserve/releases"] }])],
      new Set(),
    )
    expect(groups).toEqual([
      { title: "Reference", links: [{ label: "Release notes", href: "https://github.com/slashobserve/slashobserve/releases" }] },
    ])
  })

  test("takes the first candidate that resolves", () => {
    const groups = resolveGroups(
      [group("Signals", [{ label: "Loki", candidates: ["docs/connect/loki", "docs/use/logs-and-traces"] }])],
      new Set(["docs/use/logs-and-traces"]),
    )
    expect(groups[0].links).toEqual([{ label: "Loki", href: "/docs/use/logs-and-traces/" }])
  })

  test("drops a link with no resolving candidate and keeps its neighbours", () => {
    const groups = resolveGroups(
      [
        group("Signals", [
          { label: "Prometheus", candidates: ["docs/connect/prometheus"] },
          { label: "Annotations", candidates: ["docs/use/annotations"] },
        ]),
      ],
      new Set(["docs/connect/prometheus"]),
    )
    expect(groups[0].links.map((link) => link.label)).toEqual(["Prometheus"])
  })

  test("drops a group whose links all miss", () => {
    const groups = resolveGroups(
      [
        group("Empty", [{ label: "Gone", candidates: ["docs/gone"] }]),
        group("Kept", [{ label: "Here", candidates: ["docs/here"] }]),
      ],
      new Set(["docs/here"]),
    )
    expect(groups.map((found) => found.title)).toEqual(["Kept"])
  })
})

describe("the landing groups at the pinned docs", () => {
  const topics = resolveGroups(TOPIC_GROUPS, pinnedDocs)
  const linksOf = (title: string) => topics.find((found) => found.title === title)?.links

  test("Coming from Grafana links both entries to the import guide", () => {
    expect(linksOf("Coming from Grafana")).toEqual([
      { label: "Connect a Grafana", href: "/docs/use/import-grafana/" },
      { label: "Import and re-import", href: "/docs/use/import-grafana/" },
    ])
  })

  test("Signals holds only the stores that have a page", () => {
    expect(linksOf("Signals")).toEqual([
      { label: "Prometheus", href: "/docs/connect/prometheus/" },
      { label: "ClickHouse", href: "/docs/connect/clickhouse/" },
    ])
  })

  test("keeps the four topic groups in canvas order", () => {
    expect(topics.map((found) => found.title)).toEqual(["Build", "Coming from Grafana", "Signals", "Operate"])
  })

  test("the reference group keeps every link the pinned docs have", () => {
    const [reference] = resolveGroups([REFERENCE_GROUP], pinnedDocs)
    expect(reference.links.map((link) => link.href)).toEqual([
      "/docs/reference/observespec/",
      "/docs/reference/api/",
      "/docs/use/mcp/",
      "/docs/reference/configuration/",
      "https://github.com/slashobserve/slashobserve/releases",
      "https://github.com/slashobserve/slashobserve/blob/main/CONTRIBUTING.md",
      "/docs/get-started/known-limitations/",
    ])
  })
})
