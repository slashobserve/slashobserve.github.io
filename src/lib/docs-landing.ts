import { resolveCandidate } from "./doc-links"
import { GITHUB_URL } from "./site-nav"

export type LandingLink = { label: string; href: string }
export type LandingGroup = { title: string; links: LandingLink[] }
type GroupSpec = { title: string; links: readonly { label: string; candidates: readonly string[] }[] }

export const TOPIC_GROUPS: readonly GroupSpec[] = [
  {
    title: "Build",
    links: [
      { label: "Writing a request", candidates: ["docs/use/chat"] },
      { label: "How the agent scopes metrics", candidates: ["docs/concepts/agent"] },
      { label: "Builds, versions and rollback", candidates: ["docs/concepts/versions"] },
      { label: "Panel types", candidates: ["docs/reference/observespec"] },
      { label: "Datasources and variables", candidates: ["docs/concepts/datasources-and-variables"] },
      { label: "Comments and review", candidates: ["docs/use/review"] },
    ],
  },
  {
    title: "Coming from Grafana",
    links: [
      { label: "Connect a Grafana", candidates: ["docs/use/switch-from-grafana"] },
      { label: "Import and re-import", candidates: ["docs/use/switch-from-grafana#import"] },
      { label: "Provisioning from files", candidates: ["docs/operate/provisioning"] },
    ],
  },
  {
    title: "Signals",
    links: [
      { label: "Prometheus", candidates: ["docs/connect/prometheus"] },
      { label: "ClickHouse", candidates: ["docs/connect/clickhouse"] },
      { label: "Loki and the logs page", candidates: ["docs/connect/loki", "docs/use/logs-and-traces"] },
      { label: "Tempo and the trace view", candidates: ["docs/connect/tempo", "docs/use/logs-and-traces"] },
      { label: "Annotations", candidates: ["docs/use/annotations"] },
    ],
  },
  {
    title: "Operate",
    links: [
      { label: "Install", candidates: ["docs/get-started/install"] },
      { label: "Configuration reference", candidates: ["docs/reference/configuration"] },
      { label: "Authentication and roles", candidates: ["docs/teams/roles", "docs/connect/oidc"] },
      { label: "Metrics at /metrics", candidates: ["docs/operate/metrics"] },
      { label: "Security model", candidates: ["docs/operate/security-model"] },
      { label: "Outbound access", candidates: ["docs/operate/outbound-access"] },
    ],
  },
]

export const REFERENCE_GROUP: GroupSpec = {
  title: "Reference",
  links: [
    { label: "ObserveSpec schema", candidates: ["docs/reference/observespec"] },
    { label: "HTTP API (OpenAPI)", candidates: ["docs/reference/api"] },
    { label: "Agent tools", candidates: ["docs/use/mcp"] },
    { label: "Environment variables", candidates: ["docs/reference/configuration"] },
    { label: "Release notes", candidates: [`${GITHUB_URL}/releases`] },
    { label: "Contributing", candidates: [`${GITHUB_URL}/blob/main/CONTRIBUTING.md`] },
    { label: "Known limitations", candidates: ["docs/get-started/known-limitations"] },
  ],
}

function resolveLink(candidate: string, existingIds: ReadonlySet<string>): string | null {
  return candidate.startsWith("https://") ? candidate : resolveCandidate(candidate, existingIds)
}

export function resolveGroups(groups: readonly GroupSpec[], existingIds: ReadonlySet<string>): LandingGroup[] {
  return groups
    .map((group) => ({
      title: group.title,
      links: group.links.flatMap(({ label, candidates }) => {
        const href = candidates.map((candidate) => resolveLink(candidate, existingIds)).find((found) => found !== null)
        return href ? [{ label, href }] : []
      }),
    }))
    .filter((group) => group.links.length > 0)
}
