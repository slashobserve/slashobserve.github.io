import type { APIRoute } from "astro"
import { llmsIndex } from "../lib/agent-text"
import { getOrderedDocs } from "../lib/get-docs"

export const GET: APIRoute = async ({ site }) =>
  new Response(llmsIndex(await getOrderedDocs(), site!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
