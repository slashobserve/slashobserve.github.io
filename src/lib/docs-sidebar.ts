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

export type DocsPageRef = {
  id: string
  title: string
  description: string
  href: string
  navLabel?: string
  order?: number
}
export type OrderedItem =
  | { kind: "page"; page: DocsPageRef }
  | { kind: "group"; dir: string; label: string; index: DocsPageRef | null; items: OrderedItem[] }
export type OrderedGroup = { label: string; pages: DocsPageRef[] }
export type OrderedSection = OrderedGroup & { dir: string; items: OrderedItem[] }
export type DocsLink = { label: string; href: string; isCurrent: boolean }
export type DocsSubgroup = { label: string; containsCurrent: boolean; items: DocsItem[] }
export type DocsItem = DocsLink | DocsSubgroup
export type DocsGroup = { label: string; items: DocsItem[] }
export type PrevNext = {
  prev?: { label: string; href: string }
  next?: { label: string; href: string }
}

const ROOT_LABEL = "Docs"
const SECTION_DEPTH = 1

function dirOf(page: DocsPageRef): string {
  const slash = page.id.indexOf("/")
  return slash === -1 ? "" : page.id.slice(0, slash)
}

function lastSegment(id: string): string {
  return id.slice(id.lastIndexOf("/") + 1)
}

function labelOfDir(dir: string): string {
  const spaced = dir.replaceAll("-", " ")
  return spaced.charAt(0).toUpperCase() + spaced.slice(1)
}

function labelOf(item: OrderedItem): string {
  return item.kind === "page" ? item.page.title : item.label
}

function slugOf(item: OrderedItem): string {
  return lastSegment(item.kind === "page" ? item.page.id : item.dir)
}

function orderOf(item: OrderedItem): number {
  if (item.kind === "page") return item.page.order ?? Infinity
  return item.index?.order ?? Math.min(Infinity, ...item.items.map(orderOf))
}

function sortItems(section: string, depth: number, items: OrderedItem[]): OrderedItem[] {
  const listed = PAGE_ORDER[section] ?? []
  const rank = (item: OrderedItem) => {
    if (depth > SECTION_DEPTH) return orderOf(item)
    const index = listed.indexOf(slugOf(item))
    return index === -1 ? listed.length : index
  }
  return [...items].sort(
    (a, b) => rank(a) - rank(b) || labelOf(a).localeCompare(labelOf(b)),
  )
}

function buildItems(section: string, depth: number, pages: DocsPageRef[]): OrderedItem[] {
  const direct: OrderedItem[] = []
  const nested = new Map<string, DocsPageRef[]>()
  for (const page of pages) {
    const parts = page.id.split("/")
    const hasChildren = pages.some((other) => other.id.startsWith(`${page.id}/`))
    if (parts.length === depth + 1 && !hasChildren) {
      direct.push({ kind: "page", page })
      continue
    }
    const key = parts.slice(0, depth + 1).join("/")
    nested.set(key, [...(nested.get(key) ?? []), page])
  }
  const groups = [...nested].map(([dir, members]): OrderedItem => {
    const index = members.find((member) => member.id === dir) ?? null
    const rest = members.filter((member) => member !== index)
    return {
      kind: "group",
      dir,
      label: index?.title ?? labelOfDir(lastSegment(dir)),
      index,
      items: buildItems(section, depth + 1, rest),
    }
  })
  return sortItems(section, depth, [...direct, ...groups])
}

function readingOrder(items: OrderedItem[]): DocsPageRef[] {
  return items.flatMap((item) =>
    item.kind === "page" ? [item.page] : [...(item.index ? [item.index] : []), ...readingOrder(item.items)],
  )
}

function buildSection(dir: string, label: string, pages: DocsPageRef[]): OrderedSection {
  const items =
    dir === ""
      ? sortItems("", 0, pages.map((page): OrderedItem => ({ kind: "page", page })))
      : buildItems(dir, SECTION_DEPTH, pages)
  return { dir, label, items, pages: readingOrder(items) }
}

export function orderPages(pages: DocsPageRef[]): OrderedSection[] {
  const byDir = new Map<string, DocsPageRef[]>()
  for (const page of pages) {
    const dir = dirOf(page)
    byDir.set(dir, [...(byDir.get(dir) ?? []), page])
  }
  const known = DOC_SECTIONS.flatMap(({ dir, label }) => {
    const group = byDir.get(dir)
    return group ? [buildSection(dir, label, group)] : []
  })
  const unknown = [...byDir.keys()]
    .filter((dir) => dir !== "" && !DOC_SECTIONS.some((section) => section.dir === dir))
    .sort()
    .map((dir) => buildSection(dir, labelOfDir(dir), byDir.get(dir) ?? []))
  const root = byDir.get("")
  return [...known, ...unknown, ...(root ? [buildSection("", ROOT_LABEL, root)] : [])]
}

function toDocsItem(item: OrderedItem, currentHref: string): DocsItem {
  if (item.kind === "page") {
    return {
      label: item.page.navLabel ?? item.page.title,
      href: item.page.href,
      isCurrent: item.page.href === currentHref,
    }
  }
  const entries: OrderedItem[] = [
    ...(item.index ? [{ kind: "page" as const, page: item.index }] : []),
    ...item.items,
  ]
  const items = entries.map((entry) => toDocsItem(entry, currentHref))
  const containsCurrent = items.some((child) => ("items" in child ? child.containsCurrent : child.isCurrent))
  return { label: item.label, containsCurrent, items }
}

export function buildSidebar(ordered: OrderedSection[], currentHref: string): DocsGroup[] {
  return ordered.map((section) => ({
    label: section.label,
    items: section.items.map((item) => toDocsItem(item, currentHref)),
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
