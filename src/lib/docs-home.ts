import type { DocsPageRef, OrderedItem, OrderedSection } from "./docs-sidebar"

export const DOCS_HOME_PATH = "/docs/"

export const DOCS_HOME = {
  title: "Documentation",
  description:
    "Run SlashObserve on your own Prometheus and ClickHouse data, ask the agent for dashboards, and review every version it saves.",
  start: ["get-started/quick-start", "get-started/first-dashboard", "get-started/install", "use/mcp"],
} as const

export type HomeLink = { title: string; description: string; href: string }
export type HomeSection = { id: string; label: string; links: HomeLink[] }

const ROOT_ID = "docs"

function linkOf(page: DocsPageRef, title = page.title): HomeLink {
  return { title, description: page.description, href: page.href }
}

function linksOf(item: OrderedItem): HomeLink[] {
  if (item.kind === "page") return [linkOf(item.page)]
  return item.index ? [linkOf(item.index, item.label)] : []
}

export function homeStart(pages: readonly DocsPageRef[]): HomeLink[] {
  return DOCS_HOME.start.flatMap((id) => {
    const page = pages.find((candidate) => candidate.id === id)
    return page ? [linkOf(page)] : []
  })
}

export function homeSections(ordered: readonly OrderedSection[]): HomeSection[] {
  return ordered
    .map((section) => ({
      id: section.dir || ROOT_ID,
      label: section.label,
      links: section.items.flatMap(linksOf),
    }))
    .filter((section) => section.links.length > 0)
}

export function homeFirstPage(
  ordered: readonly { pages: readonly DocsPageRef[] }[],
): { label: string; href: string } | undefined {
  const first = ordered[0]?.pages[0]
  return first ? { label: first.title, href: first.href } : undefined
}
