import type { APIRoute } from "astro"
import { llmsFull } from "../lib/agent-text"
import { getDocBodies, getOrderedDocs } from "../lib/get-docs"

export const GET: APIRoute = async ({ site }) =>
  new Response(llmsFull(await getOrderedDocs(), await getDocBodies(), site!), {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
