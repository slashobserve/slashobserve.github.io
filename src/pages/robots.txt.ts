import type { APIRoute } from "astro"

export const GET: APIRoute = ({ site }) => {
  const body = [
    "User-agent: *",
    "Content-Signal: ai-train=yes, search=yes, ai-input=yes",
    "Allow: /",
    "",
    `Sitemap: ${new URL("/sitemap-index.xml", site).href}`,
    "",
  ].join("\n")

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  })
}
