import { existsSync, readdirSync } from "node:fs"

export const DOC_SECTIONS: readonly { dir: string; label: string }[] = [
  { dir: "get-started", label: "Get started" },
  { dir: "connect", label: "Connect" },
  { dir: "use", label: "Use" },
  { dir: "teams", label: "Teams" },
  { dir: "concepts", label: "Concepts" },
  { dir: "operate", label: "Operate" },
  { dir: "reference", label: "Reference" },
  { dir: "project", label: "Project" },
]

export type SidebarEntry =
  | { slug: string }
  | { label: string; items: { slug: string }[] }

const PAGE_ORDER: Record<string, readonly string[]> = {
  "get-started": ["what-is-slashobserve", "quick-start", "install", "first-dashboard"],
  connect: ["prometheus", "clickhouse", "oidc", "llm-providers"],
  use: ["chat", "review", "edit-panel", "import-grafana", "cli", "mcp"],
  teams: ["roles", "folders", "saved-prompts"],
  concepts: ["observespec", "agent", "datasources-and-variables", "versions"],
  operate: ["production", "upgrades-and-backups", "security-model"],
  reference: ["configuration", "datasources-file"],
}

const ROOT_LABEL = "Docs"
const ENTRY_PREFIX = "docs/"

function sentenceCase(dir: string): string {
  const words = dir.replaceAll("-", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function labelForDir(dir: string): string {
  return DOC_SECTIONS.find((section) => section.dir === dir)?.label ?? sentenceCase(dir)
}

function pageSlug(dir: string, page: string): string {
  const path = [dir, page.replace(/(^|\/)index$/, "")].filter(Boolean).join("/")
  return `${ENTRY_PREFIX}${path}`
}

function orderPages(dir: string, pages: string[]): string[] {
  const order = PAGE_ORDER[dir] ?? []
  return [
    ...order.filter((page) => pages.includes(page)),
    ...pages.filter((page) => !order.includes(page)).sort(),
  ]
}

function group(dir: string, pages: string[]): SidebarEntry {
  return {
    label: labelForDir(dir),
    items: orderPages(dir, pages).map((page) => ({ slug: pageSlug(dir, page) })),
  }
}

export function buildSidebar(
  rootPages: string[],
  sections: Record<string, string[]>,
): SidebarEntry[] {
  const dirs = Object.keys(sections)
  const known = DOC_SECTIONS.map((section) => section.dir).filter((dir) => dirs.includes(dir))
  const unknown = dirs.filter((dir) => !DOC_SECTIONS.some((section) => section.dir === dir)).sort()
  return [
    ...[...known, ...unknown].map((dir) => group(dir, sections[dir])),
    ...[...rootPages]
      .filter((name) => name !== "index")
      .sort()
      .map((name) => ({ slug: `${ENTRY_PREFIX}${name}` })),
  ]
}

function markdownPages(dir: string): string[] {
  return readdirSync(dir, { recursive: true, encoding: "utf8" })
    .filter((name) => name.endsWith(".md"))
    .map((name) => name.slice(0, -".md".length))
    .sort()
}

export function readDocsTree(docsRoot: string): {
  rootPages: string[]
  sections: Record<string, string[]>
} {
  if (!existsSync(docsRoot)) return { rootPages: [], sections: {} }
  const sectionDirs = readdirSync(docsRoot, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
  return {
    rootPages: markdownPages(docsRoot).filter((name) => !name.includes("/")),
    sections: Object.fromEntries(
      sectionDirs.map((dir) => [dir, markdownPages(`${docsRoot}/${dir}`)]),
    ),
  }
}

export function sectionLabel(entryId: string): string {
  const segments = entryId.replace(ENTRY_PREFIX, "").split("/")
  return segments.length > 1 ? labelForDir(segments[0]) : ROOT_LABEL
}
