import type { DocLinks } from "./doc-links"

export type NavItem = { label: string; href: string }

export const GITHUB_URL = "https://github.com/slashobserve/slashobserve"

export function docsEntryHref(links: DocLinks): string | null {
  return links.quickStart ?? links.selfHost
}

function navItems(entries: [label: string, href: string | null][]): NavItem[] {
  return entries.flatMap(([label, href]) => (href === null ? [] : [{ label, href }]))
}

export function headerNav(links: DocLinks): NavItem[] {
  return navItems([
    ["Docs", docsEntryHref(links)],
    ["Self-host", links.selfHost],
  ])
}

export function footerColumns(links: DocLinks): { title: string; items: NavItem[] }[] {
  return [
    { title: "Product", items: navItems([["Self-host", links.selfHost]]) },
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
