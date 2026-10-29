import type { APIRoute, GetStaticPaths } from "astro"
import { SOCIAL_CARDS, type SocialCard } from "../../lib/og/cards"
import { renderCard } from "../../lib/og/render"

export const getStaticPaths = (() =>
  SOCIAL_CARDS.map((card) => ({ params: { card: card.id }, props: { card } }))) satisfies GetStaticPaths

export const GET: APIRoute<{ card: SocialCard }> = async ({ props }) =>
  new Response(await renderCard(props.card), { headers: { "Content-Type": "image/png" } })
