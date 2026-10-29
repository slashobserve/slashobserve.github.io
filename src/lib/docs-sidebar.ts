import { existsSync, readdirSync } from "node:fs"

export const DOC_SECTIONS: readonly { dir: string; label: string }[] = [
  { dir: "get-started", label: "Get started" },
  { dir: "connect", label: "Connect" },
  { dir: "use", label: "Use" },
  { dir: "teams", label: "Teams" },
  { dir: "concepts", label: "Concepts" },
  { dir: "operate", label: "Operate" },
  { dir: "reference", label: "Reference" },
  { dir: "project", label: "Project" },
]

export type SidebarEntry =
  | { slug: string }
  | { label: string; items: [{ autogenerate: { directory: string } }] }

const ROOT_LABEL = "Docs"
const ENTRY_PREFIX = "docs/"

function sentenceCase(dir: string): string {
  const words = dir.replaceAll("-", " ")
  return words.charAt(0).toUpperCase() + words.slice(1)
}

function labelForDir(dir: string): string {
  return DOC_SECTIONS.find((section) => section.dir === dir)?.label ?? sentenceCase(dir)
}

function group(dir: string): SidebarEntry {
  return {
    label: labelForDir(dir),
    items: [{ autogenerate: { directory: `${ENTRY_PREFIX}${dir}` } }],
  }
}

export function buildSidebar(rootPages: string[], sectionDirs: string[]): SidebarEntry[] {
  const known = DOC_SECTIONS.map((section) => section.dir).filter((dir) =>
    sectionDirs.includes(dir),
  )
  const unknown = sectionDirs
    .filter((dir) => !DOC_SECTIONS.some((section) => section.dir === dir))
    .sort()
  return [
    ...[...rootPages]
      .filter((name) => name !== "index")
      .sort()
      .map((name) => ({ slug: `${ENTRY_PREFIX}${name}` })),
    ...[...known, ...unknown].map(group),
  ]
}

export function readDocsTree(docsRoot: string): { rootPages: string[]; sectionDirs: string[] } {
  if (!existsSync(docsRoot)) return { rootPages: [], sectionDirs: [] }
  const entries = readdirSync(docsRoot, { withFileTypes: true })
  return {
    rootPages: entries
      .filter((entry) => entry.isFile() && entry.name.endsWith(".md"))
      .map((entry) => entry.name.slice(0, -".md".length)),
    sectionDirs: entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
  }
}

export function sectionLabel(entryId: string): string {
  const segments = entryId.replace(ENTRY_PREFIX, "").split("/")
  return segments.length > 1 ? labelForDir(segments[0]) : ROOT_LABEL
}
