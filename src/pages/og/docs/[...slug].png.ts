import type { APIRoute, GetStaticPaths } from "astro"
import { getCollection } from "astro:content"
import { DOCS_HOME, DOCS_HOME_PATH } from "../../../lib/docs-home"
import { docCard, type DocCard } from "../../../lib/og/doc-cards"
import { renderCard } from "../../../lib/og/render"

export const getStaticPaths = (async () => {
  const entries = await getCollection("docs")
  const cards = [
    docCard(DOCS_HOME_PATH, DOCS_HOME.title),
    ...entries.map((entry) => docCard(`/docs/${entry.id}/`, entry.data.title)),
  ]
  return cards.map((card) => ({ params: { slug: card.slug }, props: { card } }))
}) satisfies GetStaticPaths

export const GET: APIRoute<{ card: DocCard }> = async ({ props }) =>
  new Response(await renderCard(props.card), { headers: { "Content-Type": "image/png" } })
