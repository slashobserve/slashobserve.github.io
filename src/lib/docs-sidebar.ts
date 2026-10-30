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

export const PAGE_ORDER: Record<string, readonly string[]> = {
  "get-started": ["what-is-slashobserve", "quick-start", "install", "first-dashboard"],
  connect: ["prometheus", "clickhouse", "oidc", "llm-providers"],
  use: ["chat", "review", "edit-panel", "import-grafana", "cli", "mcp"],
  teams: ["roles", "folders", "saved-prompts"],
  concepts: ["observespec", "agent", "datasources-and-variables", "versions"],
  operate: ["production", "upgrades-and-backups", "security-model"],
  reference: ["configuration", "datasources-file", "observespec"],
}

const DOCS_PREFIX = "/docs/"

export function sectionOf(href: string): string | null {
  if (!href.startsWith(DOCS_PREFIX)) return null
  return href.slice(DOCS_PREFIX.length).split("/")[0] || null
}

export function sectionLabel(href: string): string | null {
  const dir = sectionOf(href)
  return DOC_SECTIONS.find((section) => section.dir === dir)?.label ?? null
}

export type DocsPageRef = { id: string; title: string; description: string; href: string }
export type DocsLink = { label: string; href: string; isCurrent: boolean }
export type DocsGroup = { label: string; links: DocsLink[] }
export type PrevNext = {
  prev?: { label: string; href: string }
  next?: { label: string; href: string }
}
export type OrderedGroup = { label: string; pages: DocsPageRef[] }

const ROOT_LABEL = "Docs"

function dirOf(page: DocsPageRef): string {
  const slash = page.id.indexOf("/")
  return slash === -1 ? "" : page.id.slice(0, slash)
}

function slugOf(page: DocsPageRef): string {
  return page.id.slice(page.id.lastIndexOf("/") + 1)
}

function labelOfDir(dir: string): string {
  const spaced = dir.replaceAll("-", " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function sortPages(dir: string, pages: DocsPageRef[]): DocsPageRef[] {
  const order = PAGE_ORDER[dir] ?? []
  const rank = (page: DocsPageRef) => {
    const index = order.indexOf(slugOf(page))
    return index === -1 ? order.length : index
  }
  return [...pages].sort((a, b) => rank(a) - rank(b) || a.title.localeCompare(b.title))
}

export function orderPages(pages: DocsPageRef[]): OrderedGroup[] {
  const byDir = new Map<string, DocsPageRef[]>()
  for (const page of pages) {
    const dir = dirOf(page)
    byDir.set(dir, [...(byDir.get(dir) ?? []), page])
  }
  const known = DOC_SECTIONS.flatMap(({ dir, label }) => {
    const group = byDir.get(dir)
    return group ? [{ label, pages: sortPages(dir, group) }] : []
  })
  const unknown = [...byDir.keys()]
    .filter((dir) => dir !== "" && !DOC_SECTIONS.some((section) => section.dir === dir))
    .sort()
    .map((dir) => ({ label: labelOfDir(dir), pages: sortPages(dir, byDir.get(dir) ?? []) }))
  const root = byDir.get("")
  return [...known, ...unknown, ...(root ? [{ label: ROOT_LABEL, pages: sortPages("", root) }] : [])]
}

export function buildSidebar(ordered: OrderedGroup[], currentHref: string): DocsGroup[] {
  return ordered.map((group) => ({
    label: group.label,
    links: group.pages.map((page) => ({
      label: page.title,
      href: page.href,
      isCurrent: page.href === currentHref,
    })),
  }))
}

export function prevNext(ordered: OrderedGroup[], currentHref: string): PrevNext {
  const flat = ordered.flatMap((group) => group.pages)
  const index = flat.findIndex((page) => page.href === currentHref)
  if (index === -1) return {}
  const ref = (page: DocsPageRef | undefined) =>
    page ? { label: page.title, href: page.href } : undefined
  return { prev: ref(flat[index - 1]), next: ref(flat[index + 1]) }
}
