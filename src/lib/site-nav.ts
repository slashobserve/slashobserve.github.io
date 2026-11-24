import type { DocLinks } from "./doc-links"

export type NavItem = { label: string; href: string }
export type NavGroup = { label: string; items: NavItem[] }
export type HeaderEntry = NavItem | NavGroup

export const GITHUB_URL = "https://github.com/slashobserve/slashobserve"
export const DASHBOARDS_PATH = "/dashboards/"
export const OBSERVATIONS_PATH = "/observations/"
export const AGENTS_PATH = "/agents/"
export const MIGRATE_PATH = "/migrate/"
export const SIGNALS_PATH = "/signals/"
export const DOCS_HOME_PATH = "/docs/"
export const LLMS_TXT_PATH = "/llms.txt"

export const FEATURE_LINKS: NavItem[] = [
  { label: "Observations", href: OBSERVATIONS_PATH },
  { label: "Dashboards", href: DASHBOARDS_PATH },
  { label: "Agents", href: AGENTS_PATH },
  { label: "Signals", href: SIGNALS_PATH },
]

export const FEATURE_BLURBS: Record<string, string> = {
  [OBSERVATIONS_PATH]: "Investigation pages people and agents write together",
  [DASHBOARDS_PATH]: "Built by the agent, every panel run before the save",
  [AGENTS_PATH]: "Observe Agent, MCP clients and service accounts",
  [SIGNALS_PATH]: "Metrics, logs and traces from seven stores",
}

const MIGRATE_LINK: NavItem = { label: "Migrate", href: MIGRATE_PATH }

export const PRODUCT_LINKS: NavItem[] = [...FEATURE_LINKS, MIGRATE_LINK]

export function isNavGroup(entry: HeaderEntry): entry is NavGroup {
  return "items" in entry
}

export function holdsCurrentPage(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => isCurrentPage(item.href, pathname))
}

export function getStartedHref(links: DocLinks): string | null {
  return links.quickStart ?? links.selfHost
}

export function docsHomeHref(links: DocLinks): string | null {
  return getStartedHref(links) === null ? null : DOCS_HOME_PATH
}

function navItems(entries: [label: string, href: string | null][]): NavItem[] {
  return entries.flatMap(([label, href]) => (href === null ? [] : [{ label, href }]))
}

export function isCurrentPage(href: string, pathname: string): boolean {
  return !href.includes("#") && href === pathname
}

export function headerNav(links: DocLinks): HeaderEntry[] {
  return [{ label: "Features", items: FEATURE_LINKS }, MIGRATE_LINK, ...navItems([["Docs", docsHomeHref(links)]])]
}

export function footerColumns(links: DocLinks): { title: string; items: NavItem[] }[] {
  return [
    {
      title: "Product",
      items: [...PRODUCT_LINKS, ...navItems([["Self-host", links.selfHost]])],
    },
    {
      title: "Docs",
      items: navItems([
        ["Overview", docsHomeHref(links)],
        ["Quick start", links.quickStart],
        ["Install", links.install],
        ["Reference", links.reference],
        ["llms.txt", LLMS_TXT_PATH],
      ]),
    },
    {
      title: "Project",
      items: navItems([
        ["GitHub", GITHUB_URL],
        ["Changelog", `${GITHUB_URL}/releases`],
        ["License", `${GITHUB_URL}/blob/main/LICENSE`],
      ]),
    },
  ].filter((column) => column.items.length > 0)
}
