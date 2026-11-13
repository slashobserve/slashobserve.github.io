import type { DocLinks } from "./doc-links"

export type NavItem = { label: string; href: string }

export const GITHUB_URL = "https://github.com/slashobserve/slashobserve"
export const DASHBOARDS_PATH = "/dashboards/"
export const OBSERVATIONS_PATH = "/observations/"
export const AGENTS_PATH = "/agents/"
export const MIGRATE_PATH = "/migrate/"
export const SIGNALS_PATH = "/signals/"
export const DOCS_HOME_PATH = "/docs/"
export const LLMS_TXT_PATH = "/llms.txt"

export const PRODUCT_LINKS: NavItem[] = [
  { label: "Observations", href: OBSERVATIONS_PATH },
  { label: "Dashboards", href: DASHBOARDS_PATH },
  { label: "Agents", href: AGENTS_PATH },
  { label: "Signals", href: SIGNALS_PATH },
  { label: "Migrate", href: MIGRATE_PATH },
]

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

export function headerNav(links: DocLinks): NavItem[] {
  return [...PRODUCT_LINKS, ...navItems([["Docs", docsHomeHref(links)]])]
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
