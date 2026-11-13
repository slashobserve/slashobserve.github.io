export type DocLinkKey =
  | "quickStart"
  | "install"
  | "importGuide"
  | "mcp"
  | "selfHost"
  | "reference"
  | "roles"
  | "folders"
  | "oidc"
  | "llm"
  | "cli"
  | "cliObservations"
  | "observations"
  | "agents"
  | "proposals"
  | "inbox"
  | "connectAgent"
  | "datasources"
  | "elasticsearch"
  | "opensearch"

export type DocLinks = Record<DocLinkKey, string | null>

export const DOC_LINK_CANDIDATES: Record<DocLinkKey, readonly string[]> = {
  quickStart: ["docs/get-started/quick-start"],
  install: ["docs/get-started/install"],
  importGuide: ["docs/use/import-grafana"],
  mcp: ["docs/use/mcp"],
  selfHost: ["docs/get-started/install"],
  reference: ["docs/reference/configuration"],
  roles: ["docs/teams/roles"],
  folders: ["docs/teams/folders"],
  oidc: ["docs/connect/oidc"],
  llm: ["docs/connect/llm-providers"],
  cli: ["docs/use/cli"],
  cliObservations: ["docs/use/cli#observations"],
  observations: ["docs/use/observations"],
  agents: ["docs/use/agents"],
  proposals: ["docs/concepts/proposals"],
  inbox: ["docs/use/inbox"],
  connectAgent: ["docs/use/mcp#connect-your-own-agent"],
  datasources: ["docs/connect/prometheus"],
  elasticsearch: ["docs/connect/elasticsearch"],
  opensearch: ["docs/connect/opensearch"],
}

export function resolveCandidate(candidate: string, existingIds: ReadonlySet<string>): string | null {
  const [id, fragment] = candidate.split("#")
  if (!existingIds.has(id)) return null
  return `/${id}/${fragment ? `#${fragment}` : ""}`
}

export function resolveDocLinks(existingIds: ReadonlySet<string>): DocLinks {
  const links = {} as DocLinks
  for (const key of Object.keys(DOC_LINK_CANDIDATES) as DocLinkKey[]) {
    links[key] =
      DOC_LINK_CANDIDATES[key]
        .map((candidate) => resolveCandidate(candidate, existingIds))
        .find((href) => href !== null) ?? null
  }
  return links
}
