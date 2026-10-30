import type { APIRoute } from "astro"
import { getCollection } from "astro:content"
import { pageMarkdown } from "../../../lib/agent-text"
import { pageRefOf } from "../../../lib/get-docs"

export async function getStaticPaths() {
  const entries = await getCollection("docs")
  return entries.map((entry) => ({ params: { slug: entry.id }, props: { entry } }))
}

export const GET: APIRoute = ({ props, site }) => {
  const { entry } = props
  return new Response(pageMarkdown(pageRefOf(entry), entry.body ?? "", site!), {
    headers: { "Content-Type": "text/markdown; charset=utf-8" },
  })
}
