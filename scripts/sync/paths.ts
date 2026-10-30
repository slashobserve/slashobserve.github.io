export const CORE_REPO_URL = "https://github.com/slashobserve/slashobserve"
export const CORE_EDIT_BRANCH = "main"
export const DOCS_OUT = "src/content/docs"
export const SCHEMA_SOURCE = "spec/schema/observespec.v0.json"
export const SCHEMA_OUT = "public/schemas/observespec.v0.json"
export const CORPUS_GOLDEN_SOURCE = "pkg/grafana/testdata/golden"
export const CORPUS_OUT = "src/generated/import-corpus.json"

const SLUG = /^[a-z0-9]+(-[a-z0-9]+)*$/

function stemOf(fileName: string): string {
  const dot = fileName.lastIndexOf(".")
  return dot > 0 ? fileName.slice(0, dot) : fileName
}

export function invalidDocPath(rel: string): string | null {
  const segments = rel.split("/")
  const fileName = segments.pop() ?? ""
  const names = [...segments, stemOf(fileName)]
  const bad = names.find((name) => !SLUG.test(name))
  if (bad === undefined) return null
  return `${rel}: "${bad}" must be lowercase letters and digits separated by single hyphens`
}

export function outputPathFor(rel: string): string {
  return `${DOCS_OUT}/${rel}`
}

export function routeFor(rel: string): string {
  const segments = rel.replace(/\.md$/, "").split("/")
  if (segments[segments.length - 1] === "index") segments.pop()
  return segments.length === 0 ? "/docs/" : `/docs/${segments.join("/")}/`
}
