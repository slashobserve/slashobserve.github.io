import { getCollection } from "astro:content"
import { resolveDocLinks, type DocLinks } from "./doc-links"

export async function getDocIds(): Promise<ReadonlySet<string>> {
  const entries = await getCollection("docs")
  return new Set(entries.map((entry) => `docs/${entry.id}`))
}

export async function getDocLinks(): Promise<DocLinks> {
  return resolveDocLinks(await getDocIds())
}
