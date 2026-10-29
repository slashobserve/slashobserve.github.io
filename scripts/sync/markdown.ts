import { posix } from "node:path"
import { CORE_EDIT_BRANCH, CORE_REPO_URL, editUrlFor, routeFor } from "./paths"

export type SyncedPage = { body: string; title: string }

type Split = { front: string[] | null; rest: string[] }

const FENCE = /^ {0,3}(`{3,}|~{3,})(.*)$/
const SCHEME = /^[a-z][a-z0-9+.-]*:/i
const CODE_SPAN = /(?<!`)(`+)(?!`)[\s\S]*?(?<!`)\1(?!`)/g
const INLINE_LINK = /\]\(\s*([^\s)]*)((?:\s+(?:"[^"]*"|'[^']*'))?)\s*\)/g
const REFERENCE_DEFINITION = /^(\s{0,3}\[[^\]]+\]:\s*)(\S+)(.*)$/

function splitFrontMatter(source: string): Split {
  const lines = source.split("\n")
  if (lines[0] !== "---") return { front: null, rest: lines }
  const end = lines.indexOf("---", 1)
  if (end === -1) return { front: null, rest: lines }
  return { front: lines.slice(1, end), rest: lines.slice(end + 1) }
}

function joinPage(front: string[], rest: string[]): string {
  return ["---", ...front, "---", ...rest].join("\n")
}

function fenceMask(lines: string[]): boolean[] {
  const mask: boolean[] = []
  let open: { char: string; size: number } | null = null
  for (const line of lines) {
    const match = FENCE.exec(line)
    const marker = match?.[1] ?? ""
    if (open === null) {
      if (marker !== "") open = { char: marker[0] ?? "", size: marker.length }
      mask.push(marker !== "")
      continue
    }
    const closes =
      marker !== "" &&
      marker[0] === open.char &&
      marker.length >= open.size &&
      (match?.[2] ?? "").trim() === ""
    if (closes) open = null
    mask.push(true)
  }
  return mask
}

function unquote(value: string): string {
  const match = /^(["'])(.*)\1$/.exec(value.trim())
  return match ? (match[2] ?? "") : value.trim()
}

function takeHeading(rest: string[]): { title: string; rest: string[] } | null {
  const mask = fenceMask(rest)
  const index = rest.findIndex((line, i) => !mask[i] && /^# (.+)$/.test(line))
  if (index === -1) return null
  const title = (rest[index] ?? "").slice(2).trim()
  const drop = rest[index + 1] === "" ? 2 : 1
  return { title, rest: [...rest.slice(0, index), ...rest.slice(index + drop)] }
}

export function withFrontMatter(source: string, rel: string): SyncedPage {
  const { front, rest } = splitFrontMatter(source)
  const block = front ?? []
  const titleLine = block.find((line) => /^title:/.test(line))

  let title: string
  let body = rest
  if (titleLine !== undefined) {
    title = unquote(titleLine.slice("title:".length))
  } else {
    const heading = takeHeading(rest)
    if (heading === null) {
      throw new Error(
        `${rel}: no title: add front matter with title or start the file with a # heading`,
      )
    }
    title = heading.title
    body = heading.rest
  }

  const missing: string[] = []
  if (titleLine === undefined) missing.push(`title: ${JSON.stringify(title)}`)
  if (!block.some((line) => /^editUrl:/.test(line))) {
    missing.push(`editUrl: ${JSON.stringify(editUrlFor(rel))}`)
  }
  return { title, body: joinPage([...missing, ...block], body) }
}

function rewriteTarget(target: string, rel: string): string {
  if (target === "" || target.startsWith("#") || target.startsWith("/")) return target
  if (SCHEME.test(target)) return target

  const hashAt = target.indexOf("#")
  const fragment = hashAt === -1 ? "" : target.slice(hashAt)
  const withQuery = hashAt === -1 ? target : target.slice(0, hashAt)
  const queryAt = withQuery.indexOf("?")
  const linkPath = queryAt === -1 ? withQuery : withQuery.slice(0, queryAt)
  if (linkPath === "") return target

  const resolved = posix.normalize(posix.join("docs", posix.dirname(rel), linkPath))
  if (resolved.startsWith("..")) {
    throw new Error(`${rel}: link ${target} points outside the core repo`)
  }
  if (resolved.startsWith("docs/")) {
    if (!resolved.endsWith(".md")) return target
    return routeFor(resolved.slice("docs/".length)) + fragment
  }
  return `${CORE_REPO_URL}/blob/${CORE_EDIT_BRANCH}/${resolved}${fragment}`
}

function rewriteLine(line: string, rel: string): string {
  const definition = REFERENCE_DEFINITION.exec(line)
  if (definition) {
    const [, head = "", target = "", tail = ""] = definition
    return head + rewriteTarget(target, rel) + tail
  }
  const rewriteSegment = (segment: string) =>
    segment.replace(
      INLINE_LINK,
      (_, target: string, title: string) => `](${rewriteTarget(target, rel)}${title})`,
    )
  let out = ""
  let last = 0
  for (const span of line.matchAll(CODE_SPAN)) {
    out += rewriteSegment(line.slice(last, span.index)) + span[0]
    last = span.index + span[0].length
  }
  return out + rewriteSegment(line.slice(last))
}

export function rewriteLinks(source: string, rel: string): string {
  const { front, rest } = splitFrontMatter(source)
  const mask = fenceMask(rest)
  const rewritten = rest.map((line, i) => (mask[i] ? line : rewriteLine(line, rel)))
  return front === null ? rewritten.join("\n") : joinPage(front, rewritten)
}

export function transformPage(source: string, rel: string): string {
  return rewriteLinks(withFrontMatter(source, rel).body, rel)
}
