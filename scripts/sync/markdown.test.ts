/// <reference types="bun" />

import { describe, expect, test } from "bun:test"
import { rewriteLinks, transformPage, withFrontMatter } from "./markdown"

const SELF_HOSTING_START = `# Self-hosting SlashObserve

This guide covers running the Community Edition yourself.

## What you run
`

const EDIT_URL = (rel: string) =>
  `editUrl: "https://github.com/slashobserve/slashobserve/edit/main/docs/${rel}"`

describe("withFrontMatter", () => {
  test("derives the title from the first heading and removes it", () => {
    const page = withFrontMatter(SELF_HOSTING_START, "self-hosting.md")
    expect(page.title).toBe("Self-hosting SlashObserve")
    expect(page.body).toBe(
      [
        "---",
        'title: "Self-hosting SlashObserve"',
        EDIT_URL("self-hosting.md"),
        "---",
        "This guide covers running the Community Edition yourself.",
        "",
        "## What you run",
        "",
      ].join("\n"),
    )
  })

  test("keeps existing front matter and adds editUrl once", () => {
    const source = '---\ntitle: "Prometheus"\ndescription: Connect it\n---\n\n# Body heading\n'
    const page = withFrontMatter(source, "connect/prometheus.md")
    expect(page.title).toBe("Prometheus")
    expect(page.body).toBe(
      [
        "---",
        EDIT_URL("connect/prometheus.md"),
        'title: "Prometheus"',
        "description: Connect it",
        "---",
        "",
        "# Body heading",
        "",
      ].join("\n"),
    )
  })

  test("strips single quotes from an existing title", () => {
    expect(withFrontMatter("---\ntitle: 'Hello'\n---\nText\n", "a.md").title).toBe("Hello")
  })

  test("leaves a block that already has title and editUrl alone", () => {
    const source = `---\ntitle: Plain\neditUrl: https://example.com/e\n---\nText\n`
    expect(withFrontMatter(source, "a.md").body).toBe(source)
  })

  test("adds a missing title to existing front matter from the heading", () => {
    const page = withFrontMatter("---\ndescription: d\n---\n# Heading\n\nText\n", "a.md")
    expect(page.body).toBe(
      ['---', 'title: "Heading"', EDIT_URL("a.md"), "description: d", "---", "Text", ""].join("\n"),
    )
  })

  test("throws naming the file when there is no title anywhere", () => {
    expect(() => withFrontMatter("Just text\n\n## Sub\n", "connect/none.md")).toThrow(
      "connect/none.md: no title: add front matter with title or start the file with a # heading",
    )
  })

  test("does not take a heading inside a fenced block as the title", () => {
    const source = "```sh\n# comment\n```\n\n# Real title\n"
    const page = withFrontMatter(source, "a.md")
    expect(page.title).toBe("Real title")
    expect(page.body).toContain("```sh\n# comment\n```")
  })

  test("throws when the only heading is inside a fenced block", () => {
    expect(() => withFrontMatter("~~~\n# comment\n~~~\n", "a.md")).toThrow("a.md: no title")
  })

  test("quotes titles that need YAML escaping", () => {
    const page = withFrontMatter('# Say "hi": now\n', "a.md")
    expect(page.body).toContain('title: "Say \\"hi\\": now"')
  })
})

describe("rewriteLinks", () => {
  test.each([
    ["see [x](#anchor)", "get-started/quick-start.md", "see [x](#anchor)"],
    ["see [x](https://x)", "get-started/quick-start.md", "see [x](https://x)"],
    ["see [x](mailto:a@b.c)", "get-started/quick-start.md", "see [x](mailto:a@b.c)"],
    ["see [x](/docs/other/)", "get-started/quick-start.md", "see [x](/docs/other/)"],
    ["see [x]()", "get-started/quick-start.md", "see [x]()"],
    [
      "see [x](../connect/prometheus.md#tls)",
      "get-started/quick-start.md",
      "see [x](/docs/connect/prometheus/#tls)",
    ],
    [
      "see [x](prometheus.md)",
      "connect/clickhouse.md",
      "see [x](/docs/connect/prometheus/)",
    ],
    [
      'see [x](prometheus.md "Prom")',
      "connect/clickhouse.md",
      'see [x](/docs/connect/prometheus/ "Prom")',
    ],
    [
      "see [x](connect/index.md)",
      "self-hosting.md",
      "see [x](/docs/connect/)",
    ],
    [
      "see [x](../../deploy/compose/compose.yaml)",
      "connect/prometheus.md",
      "see [x](https://github.com/slashobserve/slashobserve/blob/main/deploy/compose/compose.yaml)",
    ],
    [
      "see [x](../../deploy/README.md#run)",
      "connect/prometheus.md",
      "see [x](https://github.com/slashobserve/slashobserve/blob/main/deploy/README.md#run)",
    ],
    ["![flow](img/flow.png)", "get-started/quick-start.md", "![flow](img/flow.png)"],
    ["[a](x.md) and [b](y.md)", "connect/z.md", "[a](/docs/connect/x/) and [b](/docs/connect/y/)"],
    ["[p]: ../connect/prometheus.md", "get-started/a.md", "[p]: /docs/connect/prometheus/"],
    [
      "[p]: ../connect/prometheus.md#tls \"T\"",
      "get-started/a.md",
      "[p]: /docs/connect/prometheus/#tls \"T\"",
    ],
  ])("%s from %s", (source, rel, expected) => {
    expect(rewriteLinks(source, rel)).toBe(expected)
  })

  test("throws for a link that escapes the core repo", () => {
    expect(() => rewriteLinks("[x](../../../x.md)", "connect/a.md")).toThrow(
      "connect/a.md: link ../../../x.md points outside the core repo",
    )
  })

  test("leaves links inside fenced blocks unchanged", () => {
    const source = "```md\n[x](../connect/prometheus.md)\n```\n~~~~\n[y](a.md)\n~~~\n[z](a.md)\n~~~~\n[w](a.md)"
    expect(rewriteLinks(source, "get-started/q.md")).toBe(
      "```md\n[x](../connect/prometheus.md)\n```\n~~~~\n[y](a.md)\n~~~\n[z](a.md)\n~~~~\n[w](/docs/get-started/a/)",
    )
  })

  test("leaves links inside inline code spans unchanged and rewrites the rest of the line", () => {
    expect(rewriteLinks("`[x](a.md)` then [y](a.md) and ``[z](b.md)``", "connect/c.md")).toBe(
      "`[x](a.md)` then [y](/docs/connect/a/) and ``[z](b.md)``",
    )
  })

  test("does not rewrite front matter", () => {
    const source = "---\ndescription: see [x](a.md)\n---\n[x](a.md)"
    expect(rewriteLinks(source, "connect/c.md")).toBe(
      "---\ndescription: see [x](a.md)\n---\n[x](/docs/connect/a/)",
    )
  })
})

describe("transformPage", () => {
  test("adds front matter and rewrites links in one pass", () => {
    const source = "# Quick start\n\nNext: [Prometheus](../connect/prometheus.md#tls)\n"
    expect(transformPage(source, "get-started/quick-start.md")).toBe(
      [
        "---",
        'title: "Quick start"',
        EDIT_URL("get-started/quick-start.md"),
        "---",
        "Next: [Prometheus](/docs/connect/prometheus/#tls)",
        "",
      ].join("\n"),
    )
  })
})
