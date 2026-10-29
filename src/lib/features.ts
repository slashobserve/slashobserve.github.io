import type { DocLinkKey, DocLinks } from "./doc-links"

export type FeatureSpec = { title: string; body: string; doc?: DocLinkKey; code?: string }
export type Feature = { title: string; body: string; href: string | null; code: string | null }
export type FeatureGroup = { title: string; items: Feature[] }

export const PANEL_TYPES_TITLE = "{panelTypes} panel types"

export const FEATURE_GROUPS: readonly { title: string; items: readonly FeatureSpec[] }[] = [
  {
    title: "Build dashboards",
    items: [
      {
        title: "Dashboards from a sentence",
        body: "Ask in the chat and get a live, Grafana-style dashboard.",
        doc: "quickStart",
      },
      {
        title: "Queries checked before saving",
        body: "The agent lints and runs every PromQL and SQL query, and repairs what fails.",
      },
      {
        title: "Follow-ups revise the same dashboard",
        body: "Keep asking in the chat; each answer is a new version.",
      },
      {
        title: "Saved prompts",
        body: "Keep the prompts your team reuses and run them in one click.",
      },
      {
        title: PANEL_TYPES_TITLE,
        body: "Time series, stat, gauge, table, heatmap, logs, state timeline and more, plus rows and repeats.",
      },
      {
        title: "Variables",
        body: "Query, custom, interval, textbox, datasource and ad hoc variables, multi-value and All.",
      },
    ],
  },
  {
    title: "Review and edit",
    items: [
      {
        title: "One activity timeline",
        body: "Comments, agent requests and versions in one place on every dashboard.",
      },
      {
        title: "Send a comment to the agent",
        body: "Turn feedback into a revision without leaving the dashboard.",
      },
      { title: "Versions with diffs", body: "Compare any two versions and restore one." },
      {
        title: "Panel editor",
        body: "Edit queries with a live preview against the saved series, or edit the panel as JSON.",
      },
    ],
  },
  {
    title: "Teams",
    items: [
      {
        title: "Roles",
        body: "Admin, editor, commenter and viewer, mapped from your OIDC groups.",
        doc: "roles",
      },
      {
        title: "Folders",
        body: "Group dashboards and grant access per folder.",
        doc: "folders",
      },
      { title: "Share links", body: "Copy a dashboard or panel link with its time range and variables. It grants no access on its own." },
      {
        title: "The agent acts as you",
        body: "It can only change what the person asking can change.",
        doc: "roles",
      },
    ],
  },
  {
    title: "Bring Grafana dashboards",
    items: [
      {
        title: "Import by paste, upload, CLI or MCP",
        body: "Same queries, layout, units, thresholds, overrides and mappings.",
        doc: "importGuide",
      },
      {
        title: "Import report",
        body: "Nothing is dropped silently: unsupported panels become placeholders with a reason.",
        doc: "importGuide",
      },
    ],
  },
  {
    title: "Connect",
    items: [
      {
        title: "Prometheus and ClickHouse",
        body: "Queries run through a read-only proxy to your own datasources.",
        doc: "datasources",
      },
      {
        title: "MCP for editors",
        body: "Claude Code, Cursor and OpenCode build dashboards and answer comments with their own model.",
        doc: "mcp",
      },
      {
        title: "The observe CLI",
        body: "Ask, list and import from a shell with a service-account key.",
        doc: "cli",
        code: "observe",
      },
      { title: "HTTP API", body: "Everything the app does, documented with OpenAPI." },
    ],
  },
  {
    title: "Run it yourself",
    items: [
      {
        title: "One binary and Postgres",
        body: "The web app is embedded in the Go server.",
        doc: "install",
      },
      {
        title: "Your own model",
        body: "Anthropic or any OpenAI-compatible endpoint.",
        doc: "llm",
      },
      { title: "OIDC sign-in", body: "Use your existing identity provider.", doc: "oidc" },
      { title: "Apache-2.0", body: "Open source, built in the open on GitHub." },
    ],
  },
]

export function featureGroups(links: DocLinks, panelTypeCount: number): FeatureGroup[] {
  return FEATURE_GROUPS.map((group) => ({
    title: group.title,
    items: group.items.map((spec) => ({
      title: spec.title === PANEL_TYPES_TITLE ? `${panelTypeCount} panel types` : spec.title,
      body: spec.body,
      href: spec.doc ? links[spec.doc] : null,
      code: spec.code ?? null,
    })),
  })).filter((group) => group.items.length > 0)
}
