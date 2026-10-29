import type { DocLinks } from "./doc-links"

export type NavItem = { label: string; href: string }

export const GITHUB_URL = "https://github.com/slashobserve/slashobserve"
export const FEATURES_PATH = "/features/"
export const GRAFANA_PATH = "/grafana/"

export function docsEntryHref(links: DocLinks): string | null {
  return links.quickStart ?? links.selfHost
}

function navItems(entries: [label: string, href: string | null][]): NavItem[] {
  return entries.flatMap(([label, href]) => (href === null ? [] : [{ label, href }]))
}

export function isCurrentPage(href: string, pathname: string): boolean {
  return !href.includes("#") && href === pathname
}

export function headerNav(links: DocLinks): NavItem[] {
  return navItems([
    ["Features", FEATURES_PATH],
    ["Coming from Grafana", GRAFANA_PATH],
    ["Docs", docsEntryHref(links)],
    ["Self-host", links.selfHost],
  ])
}

export function footerColumns(links: DocLinks): { title: string; items: NavItem[] }[] {
  return [
    {
      title: "Product",
      items: navItems([
        ["Features", FEATURES_PATH],
        ["Coming from Grafana", GRAFANA_PATH],
        ["Self-host", links.selfHost],
      ]),
    },
    {
      title: "Docs",
      items: navItems([
        ["Quick start", links.quickStart],
        ["Install", links.install],
        ["Reference", links.reference],
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
