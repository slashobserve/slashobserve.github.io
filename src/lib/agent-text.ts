import type { DocsPageRef, OrderedGroup } from "./docs-sidebar"

const TAGLINE = "Dashboards from a sentence, on your own data."

function tidyBody(body: string): string {
  return `${body.replace(/^\n+/, "").trimEnd()}\n`
}

function pageUrl(page: DocsPageRef, site: URL): string {
  return new URL(page.href, site).href
}

function markdownUrl(page: DocsPageRef, site: URL): string {
  return new URL(`${page.href}index.md`, site).href
}

export function pageMarkdown(page: DocsPageRef, body: string, site: URL): string {
  return [
    "---",
    `title: ${JSON.stringify(page.title)}`,
    `description: ${JSON.stringify(page.description)}`,
    "---",
    "",
    "> Documentation Index",
    `> Fetch the complete documentation index at: ${new URL("/llms.txt", site).href}`,
    "> Use this file to discover all available pages before exploring further.",
    "",
    `# ${page.title}`,
    "",
    tidyBody(body),
  ].join("\n")
}

export function llmsIndex(groups: OrderedGroup[], site: URL): string {
  const sections = groups.flatMap((group) => [
    `## ${group.label}`,
    "",
    ...group.pages.map(
      (page) => `- [${page.title}](${markdownUrl(page, site)}): ${page.description}`,
    ),
    "",
  ])
  return [
    "# SlashObserve",
    "",
    `> ${TAGLINE}`,
    "",
    `Full documentation in one file: ${new URL("/llms-full.txt", site).href}`,
    "",
    ...sections,
  ]
    .join("\n")
    .replace(/\n+$/, "\n")
}

export function llmsFull(
  groups: OrderedGroup[],
  bodies: Map<string, string>,
  site: URL,
): string {
  const pages = groups.flatMap((group) => group.pages).flatMap((page) => [
    "",
    `# ${page.title}`,
    "",
    `> ${page.description}`,
    "",
    `Source: ${pageUrl(page, site)} · Markdown: ${markdownUrl(page, site)}`,
    "",
    tidyBody(bodies.get(page.id) ?? "").trimEnd(),
  ])
  return [
    "# SlashObserve",
    "",
    `> ${TAGLINE}`,
    "",
    `Index: ${new URL("/llms.txt", site).href}`,
    ...pages,
    "",
  ].join("\n")
}
