import type { DocLinks } from "./doc-links"
import { DOCS_HOME_PATH } from "./docs-home"

export type NavItem = { label: string; href: string }

export const GITHUB_URL = "https://github.com/slashobserve/slashobserve"
export const FEATURES_PATH = "/features/"
export const GRAFANA_PATH = "/grafana/"

export const PRODUCT_LINKS: NavItem[] = [
  { label: "Features", href: FEATURES_PATH },
  { label: "Coming from Grafana", href: GRAFANA_PATH },
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
  return [
    ...PRODUCT_LINKS,
    ...navItems([
      ["Docs", docsHomeHref(links)],
      ["Self-host", links.selfHost],
    ]),
  ]
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
