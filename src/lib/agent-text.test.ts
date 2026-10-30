import { describe, expect, test } from "bun:test"
import { llmsFull, llmsIndex, pageMarkdown } from "./agent-text"
import type { DocsPageRef, OrderedGroup } from "./docs-sidebar"

const SITE = new URL("https://slashobserve.com")

function page(id: string, title: string, description: string): DocsPageRef {
  return { id, title, description, href: `/docs/${id}/` }
}

const quickStart = page("get-started/quick-start", "Quick start", 'Run the "demo" stack.')
const prometheus = page("connect/prometheus", "Prometheus", "Connect a Prometheus.")
const groups: OrderedGroup[] = [
  { label: "Get started", pages: [quickStart] },
  { label: "Connect", pages: [prometheus] },
]
const bodies = new Map([
  [quickStart.id, "\n\nRun it.\n\n## Step\n\nDone.\n\n"],
  [prometheus.id, "Point it at Prometheus.\n"],
])

describe("pageMarkdown", () => {
  test("adds quoted front matter, the index pointer and the title above the body", () => {
    expect(pageMarkdown(quickStart, "\n\nRun it.\n", SITE)).toBe(
      [
        "---",
        'title: "Quick start"',
        'description: "Run the \\"demo\\" stack."',
        "---",
        "",
        "> Documentation Index",
        "> Fetch the complete documentation index at: https://slashobserve.com/llms.txt",
        "> Use this file to discover all available pages before exploring further.",
        "",
        "# Quick start",
        "",
        "Run it.",
        "",
      ].join("\n"),
    )
  })
})

describe("llmsIndex", () => {
  test("lists one block per section in sidebar order with markdown links", () => {
    expect(llmsIndex(groups, SITE)).toBe(
      [
        "# SlashObserve",
        "",
        "> Dashboards from a sentence, on your own data.",
        "",
        "Full documentation in one file: https://slashobserve.com/llms-full.txt",
        "",
        "## Get started",
        "",
        '- [Quick start](https://slashobserve.com/docs/get-started/quick-start/index.md): Run the "demo" stack.',
        "",
        "## Connect",
        "",
        "- [Prometheus](https://slashobserve.com/docs/connect/prometheus/index.md): Connect a Prometheus.",
        "",
      ].join("\n"),
    )
  })
})

describe("llmsFull", () => {
  test("concatenates every page in sidebar order under the index header", () => {
    expect(llmsFull(groups, bodies, SITE)).toBe(
      [
        "# SlashObserve",
        "",
        "> Dashboards from a sentence, on your own data.",
        "",
        "Index: https://slashobserve.com/llms.txt",
        "",
        "# Quick start",
        "",
        '> Run the "demo" stack.',
        "",
        "Source: https://slashobserve.com/docs/get-started/quick-start/ · Markdown: https://slashobserve.com/docs/get-started/quick-start/index.md",
        "",
        "Run it.",
        "",
        "## Step",
        "",
        "Done.",
        "",
        "# Prometheus",
        "",
        "> Connect a Prometheus.",
        "",
        "Source: https://slashobserve.com/docs/connect/prometheus/ · Markdown: https://slashobserve.com/docs/connect/prometheus/index.md",
        "",
        "Point it at Prometheus.",
        "",
      ].join("\n"),
    )
  })
})
