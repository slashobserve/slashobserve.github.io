import { sectionLabel } from "../docs-sidebar"

export type DocCard = { slug: string; image: string; section: string; title: string }

export function docCard(pathname: string, title: string): DocCard {
  const path = pathname.endsWith("/") ? pathname : `${pathname}/`
  const slug = path.replace(/^\/docs\//, "").replace(/\/$/, "") || "index"
  const label = sectionLabel(path)
  return {
    slug,
    image: `/og/docs/${slug}.png`,
    section: label ? `Docs · ${label}` : "Docs",
    title,
  }
}
