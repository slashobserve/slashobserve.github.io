import { getCollection } from "astro:content"
import { resolveDocLinks, type DocLinks } from "./doc-links"

export async function getDocLinks(): Promise<DocLinks> {
  const entries = await getCollection("docs")
  return resolveDocLinks(new Set(entries.map((entry) => entry.id)))
}
