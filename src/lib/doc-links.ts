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
  | "datasources"

export type DocLinks = Record<DocLinkKey, string | null>

export const DOC_LINK_CANDIDATES: Record<DocLinkKey, readonly string[]> = {
  quickStart: ["docs/get-started/quick-start", "docs/self-hosting#quick-start"],
  install: ["docs/get-started/install", "docs/self-hosting#run-your-own-deployment"],
  importGuide: ["docs/use/import-from-grafana", "docs/self-hosting#import-grafana-dashboards"],
  mcp: ["docs/use/mcp", "docs/self-hosting#mcp"],
  selfHost: ["docs/self-hosting"],
  reference: ["docs/reference"],
  roles: ["docs/teams/roles", "docs/self-hosting#roles"],
  folders: ["docs/teams/folders", "docs/self-hosting#folders-and-access"],
  oidc: ["docs/connect/oidc", "docs/self-hosting#sign-in-with-oidc"],
  llm: ["docs/connect/llm-providers", "docs/self-hosting#llm-providers"],
  cli: ["docs/use/cli", "docs/self-hosting#cli"],
  datasources: ["docs/connect/prometheus", "docs/self-hosting#datasources-file"],
}

function resolveCandidate(candidate: string, existingIds: ReadonlySet<string>): string | null {
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
