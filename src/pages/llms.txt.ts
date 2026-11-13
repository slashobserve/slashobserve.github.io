import type { APIRoute } from "astro"
import { llmsIndex } from "../lib/agent-text"
import { getOrderedDocs } from "../lib/get-docs"
import { cardFor } from "../lib/og/cards"
import { PRODUCT_LINKS } from "../lib/site-nav"

export const GET: APIRoute = async ({ site }) => {
  const pages = PRODUCT_LINKS.flatMap(({ label, href }) => {
    const card = cardFor(href)
    return card ? [`- [${label}](${new URL(href, site).href}): ${card.title}`] : []
  })
  const body = [llmsIndex(await getOrderedDocs(), site!), "## Product pages", "", ...pages, ""].join("\n")
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8" } })
}
