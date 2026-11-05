import type { APIRoute, GetStaticPaths } from "astro"
import { getCollection } from "astro:content"
import { docCard, type DocCard } from "../../../lib/og/doc-cards"
import { renderCard } from "../../../lib/og/render"

export const getStaticPaths = (async () => {
  const entries = await getCollection("docs")
  const cards = entries.map((entry) => docCard(`/docs/${entry.id}/`, entry.data.title))
  return cards.map((card) => ({ params: { slug: card.slug }, props: { card } }))
}) satisfies GetStaticPaths

export const GET: APIRoute<{ card: DocCard }> = async ({ props }) =>
  new Response(await renderCard(props.card), { headers: { "Content-Type": "image/png" } })
