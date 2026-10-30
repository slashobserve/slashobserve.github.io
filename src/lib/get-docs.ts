import { getCollection, type CollectionEntry } from "astro:content"
import { orderPages, type DocsPageRef, type OrderedSection } from "./docs-sidebar"

const EDIT_BASE = "https://github.com/slashobserve/slashobserve/edit/main/docs/"
const CONTENT_ROOT = /^src\/content\/docs\//

export function pageRefOf(entry: CollectionEntry<"docs">): DocsPageRef {
  return {
    id: entry.id,
    title: entry.data.title,
    description: entry.data.description,
    href: `/docs/${entry.id}/`,
    ...(entry.data.navLabel === undefined ? {} : { navLabel: entry.data.navLabel }),
    ...(entry.data.order === undefined ? {} : { order: entry.data.order }),
  }
}

export async function getOrderedDocs(): Promise<OrderedSection[]> {
  const entries = await getCollection("docs")
  return orderPages(entries.map(pageRefOf))
}

export async function getDocBodies(): Promise<Map<string, string>> {
  const entries = await getCollection("docs")
  return new Map(entries.map((entry) => [entry.id, entry.body ?? ""]))
}

export function editUrlFor(entry: { filePath?: string }): string {
  return `${EDIT_BASE}${(entry.filePath ?? "").replace(CONTENT_ROOT, "")}`
}
